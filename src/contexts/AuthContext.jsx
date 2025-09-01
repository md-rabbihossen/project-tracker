import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [realtimeData, setRealtimeData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email,
          email: firebaseUser.email,
        });
      } else {
        setUser(null);
        setRealtimeData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Set up real-time listener for user data when user is authenticated
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, "userData", user.id),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setRealtimeData(data);
          console.log("🔄 Real-time data updated from Firebase:", data);

          // Sync daily progress data to localStorage
          if (data.dailyProgress) {
            Object.keys(data.dailyProgress).forEach((date) => {
              const progressKey = `dailyProgress_${date}`;
              localStorage.setItem(
                progressKey,
                JSON.stringify(data.dailyProgress[date])
              );
            });
          }

          // Sync Pomodoro stats to localStorage
          if (data.pomodoroStats) {
            localStorage.setItem(
              "pomodoroStats",
              JSON.stringify(data.pomodoroStats)
            );
          }

          // Trigger custom event for app to update its state
          window.dispatchEvent(
            new CustomEvent("firebaseDataUpdate", {
              detail: data,
            })
          );
        }
      },
      (error) => {
        console.error("Real-time listener error:", error);
      }
    );

    return unsubscribe;
  }, [user]);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.message };
    }
  };

  const register = async (name, email, password) => {
    console.log(
      "🔥 FIREBASE REGISTER CALLED - Using Firebase instead of backend!"
    );
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update the user's display name
      await updateProfile(result.user, {
        displayName: name,
      });

      // Create user document in Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        name,
        email,
        createdAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const syncUserData = async (userData) => {
    if (!user || isSyncing) return;

    try {
      setIsSyncing(true);

      // Include daily progress data in the sync
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const dailyProgressKey = `dailyProgress_${today}`;
      const todayProgress = localStorage.getItem(dailyProgressKey);

      // Include Pomodoro stats in the sync
      const pomodoroStats = localStorage.getItem("pomodoroStats");

      // Filter out undefined values to prevent Firebase errors
      const cleanUserData = Object.fromEntries(
        Object.entries(userData).filter(([, value]) => value !== undefined)
      );

      const dataToSync = {
        ...cleanUserData,
        lastUpdated: new Date().toISOString(),
      };

      // Add today's progress if it exists
      if (todayProgress) {
        dataToSync.dailyProgress = {
          [today]: JSON.parse(todayProgress),
        };
      }

      // Add Pomodoro stats if they exist
      if (pomodoroStats) {
        try {
          dataToSync.pomodoroStats = JSON.parse(pomodoroStats);
        } catch (error) {
          console.warn("Failed to parse Pomodoro stats for sync:", error);
        }
      }

      await setDoc(doc(db, "userData", user.id), dataToSync, { merge: true });
      console.log("Data synced successfully to Firebase");
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getUserData = async () => {
    if (!user) return null;

    try {
      const docRef = doc(db, "userData", user.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return { books: [], tasks: [], progress: {} };
      }
    } catch (error) {
      console.error("Get user data error:", error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    syncUserData,
    getUserData,
    realtimeData,
    isSyncing,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
