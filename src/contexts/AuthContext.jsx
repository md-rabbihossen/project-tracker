import { createContext, useContext, useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(false); // Always false since no Firebase loading
  const [isSyncing, setIsSyncing] = useState(false);

  // For localStorage-only app, user is always null (not authenticated)
  useEffect(() => {
    setUser(null);
    setLoading(false);
  }, []);

  // Dummy functions for compatibility (always fail for localStorage-only app)
  const login = async (email, password) => {
    return {
      success: false,
      message: "Authentication not available in localStorage-only mode",
    };
  };

  const register = async (name, email, password) => {
    return {
      success: false,
      message: "Registration not available in localStorage-only mode",
    };
  };

  const logout = async () => {
    // Already logged out in localStorage-only mode
  };

  // Dummy sync function (does nothing since we're localStorage-only)
  const syncUserData = async (userData) => {
    // No-op for localStorage-only mode
  };

  // Dummy get user data function
  const getUserData = async () => {
    return null; // No user data since not authenticated
  };

  const value = {
    user: null, // Always null for localStorage-only
    loading: false, // Never loading
    login,
    register,
    logout,
    syncUserData,
    getUserData,
    realtimeData: null, // No real-time data
    isSyncing: false, // Never syncing
    isAuthenticated: false, // Always false for localStorage-only
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
