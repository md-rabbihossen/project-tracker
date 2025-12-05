import { useEffect, useRef, useState } from "react";
import { syncData } from "../services/supabase";

/**
 * Custom hook for Supabase sync functionality
 * Handles automatic sync to cloud and real-time updates
 */
export const useSupabaseSync = () => {
  const [userId, setUserId] = useState(() => localStorage.getItem("userId"));
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const syncTimeoutRef = useRef(null);
  const subscriptionsRef = useRef([]);

  // Debounced sync function to prevent too many API calls
  const debouncedSync = (syncFunction, delay = 1000) => {
    return (...args) => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSyncing(true);
          await syncFunction(...args);
          setLastSyncTime(new Date());
          console.log("✅ Data synced to cloud");
        } catch (error) {
          console.error("❌ Sync failed:", error);
        } finally {
          setIsSyncing(false);
        }
      }, delay);
    };
  };

  // Sync functions
  const syncRoadmap = debouncedSync(async (roadmap) => {
    console.log(
      "🔄 syncRoadmap called with:",
      roadmap ? "data exists" : "no data"
    );
    if (!roadmap) return;
    await syncData.saveRoadmap(roadmap);
    localStorage.setItem("roadmap", JSON.stringify(roadmap));
  });

  const syncTodayTasks = debouncedSync(
    async (tasks, completedOneTimeTasks, lastResetDate) => {
      console.log("🔄 syncTodayTasks called with:", tasks?.length, "tasks");
      await syncData.saveTodayTasks(
        tasks,
        completedOneTimeTasks,
        lastResetDate
      );
      localStorage.setItem("todayTasks", JSON.stringify(tasks));
      localStorage.setItem(
        "completedOneTimeTasks",
        JSON.stringify(completedOneTimeTasks)
      );
      if (lastResetDate) {
        localStorage.setItem("todayTasksLastReset", lastResetDate);
      }
    }
  );

  const syncBooks = debouncedSync(async (books) => {
    console.log("🔄 syncBooks called with:", books?.length, "books");
    await syncData.saveBooks(books);
    localStorage.setItem("books", JSON.stringify(books));
  });

  const syncPomodoroStats = debouncedSync(async (stats) => {
    console.log("🔄 syncPomodoroStats called");
    if (!stats) return;
    await syncData.savePomodoroStats(stats);
    localStorage.setItem("pomodoroStats", JSON.stringify(stats));
  });

  const syncGoals = debouncedSync(async (goals) => {
    console.log("🔄 syncGoals called with:", goals?.length, "goals");
    await syncData.saveUserGoals(goals);
    localStorage.setItem("userGoals", JSON.stringify(goals));
  });

  const syncAppSettings = debouncedSync(async (settings) => {
    console.log("🔄 syncAppSettings called");
    await syncData.saveAppSettings(settings);
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  });

  const syncDailyProgress = debouncedSync(async (date, progressData) => {
    await syncData.saveDailyProgress(date, progressData);
    localStorage.setItem(`dailyProgress_${date}`, JSON.stringify(progressData));
  });

  // Load all data from Supabase on initial login
  const loadInitialData = async () => {
    if (!userId) return null;

    try {
      setIsSyncing(true);
      console.log("📥 Loading data from cloud...");

      const cloudData = await syncData.loadAll();

      // Merge cloud data with local data (cloud takes precedence if more recent)
      return cloudData;
    } catch (error) {
      console.error("❌ Failed to load data from cloud:", error);
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = (callbacks) => {
    if (!userId) return;

    console.log("🔄 Setting up real-time subscriptions...");

    // Clean up existing subscriptions
    subscriptionsRef.current.forEach((sub) => {
      if (sub && typeof sub.unsubscribe === "function") {
        sub.unsubscribe();
      }
    });
    subscriptionsRef.current = [];

    // Subscribe to roadmap changes
    if (callbacks.onRoadmapUpdate) {
      const roadmapSub = syncData.subscribeToRoadmap((newData) => {
        console.log("🔄 Roadmap updated from another device");
        callbacks.onRoadmapUpdate(newData);
      });
      subscriptionsRef.current.push(roadmapSub);
    }

    // Subscribe to tasks changes
    if (callbacks.onTasksUpdate) {
      const tasksSub = syncData.subscribeToTodayTasks((newData) => {
        console.log("🔄 Tasks updated from another device", {
          tasksCount: newData.tasks?.length || 0,
          completedCount: newData.completedOneTimeTasks?.length || 0,
          lastReset: newData.lastResetDate,
        });
        callbacks.onTasksUpdate(newData);
      });
      subscriptionsRef.current.push(tasksSub);
    }

    // Subscribe to books changes
    if (callbacks.onBooksUpdate) {
      const booksSub = syncData.subscribeToBooks((newData) => {
        console.log("🔄 Books updated from another device");
        callbacks.onBooksUpdate(newData);
      });
      subscriptionsRef.current.push(booksSub);
    }

    // Subscribe to goals changes
    if (callbacks.onGoalsUpdate) {
      const goalsSub = syncData.subscribeToGoals((newData) => {
        console.log("🔄 Goals updated from another device");
        callbacks.onGoalsUpdate(newData);
      });
      subscriptionsRef.current.push(goalsSub);
    }

    // Subscribe to daily tasks (Track page) changes
    if (callbacks.onDailyTasksUpdate) {
      const dailyTasksSub = syncData.subscribeToDailyTasks((newData) => {
        console.log("🔄 Daily tasks (Track page) updated from another device", {
          tasksCount: newData?.length || 0,
        });
        callbacks.onDailyTasksUpdate(newData);
      });
      subscriptionsRef.current.push(dailyTasksSub);
    }
  };

  // Clean up subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((sub) => {
        if (sub && typeof sub.unsubscribe === "function") {
          sub.unsubscribe();
        }
      });
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    userId,
    setUserId,
    isSyncing,
    lastSyncTime,
    syncRoadmap,
    syncTodayTasks,
    syncBooks,
    syncPomodoroStats,
    syncGoals,
    syncAppSettings,
    syncDailyProgress,
    loadInitialData,
    setupRealtimeSubscriptions,
  };
};

/**
 * Login/Logout handlers
 */
export const handleLogin = async (userId, userName) => {
  try {
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", userName);

    // Create or update user in database
    await syncData.createOrUpdateUser(userId, userName);

    console.log("✅ User logged in:", userId);
    return true;
  } catch (error) {
    console.error("❌ Login failed:", error);
    return false;
  }
};

export const handleLogout = () => {
  // Clear user data from localStorage
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");

  console.log("✅ User logged out");
  window.location.reload(); // Refresh to show login page
};

/**
 * Sync status indicator component
 */
export const SyncStatusIndicator = ({ isSyncing, lastSyncTime }) => {
  if (isSyncing) {
    return (
      <div className="flex items-center text-sm text-blue-600">
        <svg
          className="animate-spin h-4 w-4 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Syncing...
      </div>
    );
  }

  if (lastSyncTime) {
    const timeSince = Math.floor((Date.now() - lastSyncTime) / 1000);
    let timeText = "";

    if (timeSince < 60) {
      timeText = "just now";
    } else if (timeSince < 3600) {
      timeText = `${Math.floor(timeSince / 60)}m ago`;
    } else {
      timeText = `${Math.floor(timeSince / 3600)}h ago`;
    }

    return (
      <div className="flex items-center text-sm text-green-600">
        <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Synced {timeText}
      </div>
    );
  }

  return null;
};
