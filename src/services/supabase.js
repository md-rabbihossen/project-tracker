import { createClient } from "@supabase/supabase-js";

// ⚠️ REPLACE THESE WITH YOUR SUPABASE PROJECT CREDENTIALS
// Get them from: Supabase Dashboard → Settings → API
const supabaseUrl = "https://vndlnqetnjelddfanmqq.supabase.co"; // e.g., "https://xxxxx.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuZGxucWV0bmplbGRkZmFubXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTk5MDAsImV4cCI6MjA3NjAzNTkwMH0.FQVnimgJEDDRKIh3UKWE6cansqWFjiJNeJ1MgapCFNo"; // Your anon/public key

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate or retrieve user ID
 * Creates a unique UUID and stores it in localStorage
 * Same system as Study Timer app
 */
export const generateUserId = () => {
  const savedUserId = localStorage.getItem("userId");
  if (savedUserId) return savedUserId;

  const newUserId = crypto.randomUUID();
  localStorage.setItem("userId", newUserId);
  return newUserId;
};

/**
 * Sync service for Progress Tracker
 * Handles all data synchronization with Supabase
 */
export const syncData = {
  // =====================================================
  // ROADMAP SYNC
  // =====================================================
  async saveRoadmap(roadmapData) {
    try {
      const userId = generateUserId();
      console.log("🔄 Saving roadmap to Supabase:", { userId, roadmapData });

      const { data, error } = await supabase.from("roadmap").upsert(
        {
          user_id: userId,
          roadmap_data: roadmapData,
        },
        { onConflict: "user_id" }
      );

      if (error) {
        console.error("❌ Supabase upsert error:", error);
        throw error;
      }
      console.log("✅ Roadmap synced to cloud", data);
      return data;
    } catch (error) {
      console.error("❌ Error saving roadmap:", error);
      throw error;
    }
  },

  async getRoadmap() {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase
        .from("roadmap")
        .select("roadmap_data")
        .eq("user_id", userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 row

      if (error) {
        console.error("Error fetching roadmap:", error);
        return null;
      }

      return data?.roadmap_data || null;
    } catch (error) {
      console.error("❌ Error getting roadmap:", error);
      return null;
    }
  },

  // =====================================================
  // TODAY TASKS SYNC
  // =====================================================
  async saveTodayTasks(tasks, completedOneTimeTasks, lastResetDate) {
    try {
      const userId = generateUserId();
      console.log("🔄 Saving today tasks to Supabase:", {
        userId,
        tasksCount: tasks?.length,
      });

      const { data, error } = await supabase.from("today_tasks").upsert(
        {
          user_id: userId,
          tasks: tasks,
          completed_one_time_tasks: completedOneTimeTasks,
          last_reset_date: lastResetDate,
        },
        { onConflict: "user_id" }
      );

      if (error) {
        console.error("❌ Supabase upsert error:", error);
        throw error;
      }
      console.log("✅ Today tasks synced to cloud", data);
      return data;
    } catch (error) {
      console.error("❌ Error saving today tasks:", error);
      throw error;
    }
  },

  async getTodayTasks() {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase
        .from("today_tasks")
        .select("tasks, completed_one_time_tasks, last_reset_date")
        .eq("user_id", userId)
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 row

      if (error) {
        console.error("Error fetching tasks:", error);
        return {
          tasks: [],
          completedOneTimeTasks: [],
          lastResetDate: null,
        };
      }

      return {
        tasks: data?.tasks || [],
        completedOneTimeTasks: data?.completed_one_time_tasks || [],
        lastResetDate: data?.last_reset_date || null,
      };
    } catch (error) {
      console.error("❌ Error getting today tasks:", error);
      return {
        tasks: [],
        completedOneTimeTasks: [],
        lastResetDate: null,
      };
    }
  },

  // =====================================================
  // BOOKS SYNC
  // =====================================================
  async saveBooks(booksData) {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase.from("books").upsert(
        {
          user_id: userId,
          books_data: booksData,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;
      console.log("✅ Books synced to cloud");
      return data;
    } catch (error) {
      console.error("❌ Error saving books:", error);
      throw error;
    }
  },

  async getBooks() {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase
        .from("books")
        .select("books_data")
        .eq("user_id", userId)
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 row

      if (error) {
        console.error("Error fetching books:", error);
        return [];
      }

      return data?.books_data || [];
    } catch (error) {
      console.error("❌ Error getting books:", error);
      return [];
    }
  },

  // =====================================================
  // POMODORO STATS SYNC
  // =====================================================
  async savePomodoroStats(statsData) {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase.from("pomodoro_stats").upsert(
        {
          user_id: userId,
          stats_data: statsData,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;
      console.log("✅ Pomodoro stats synced to cloud");
      return data;
    } catch (error) {
      console.error("❌ Error saving pomodoro stats:", error);
      throw error;
    }
  },

  async getPomodoroStats() {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase
        .from("pomodoro_stats")
        .select("stats_data")
        .eq("user_id", userId)
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 row

      if (error) {
        console.error("Error fetching pomodoro stats:", error);
        return null;
      }

      return data?.stats_data || null;
    } catch (error) {
      console.error("❌ Error getting pomodoro stats:", error);
      return null;
    }
  },

  // =====================================================
  // DAILY PROGRESS SYNC
  // =====================================================
  async saveDailyProgress(date, progressData) {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase.from("daily_progress").upsert(
        {
          user_id: userId,
          date: date,
          progress_data: progressData,
        },
        { onConflict: "user_id,date" }
      );

      if (error) throw error;
      console.log("✅ Daily progress synced to cloud");
      return data;
    } catch (error) {
      console.error("❌ Error saving daily progress:", error);
      throw error;
    }
  },

  async getDailyProgress(date) {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase
        .from("daily_progress")
        .select("progress_data")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 row

      if (error) {
        console.error("Error fetching daily progress:", error);
        return null;
      }

      return data?.progress_data || null;
    } catch (error) {
      console.error("❌ Error getting daily progress:", error);
      return null;
    }
  },

  async getAllDailyProgress() {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase
        .from("daily_progress")
        .select("date, progress_data")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching all daily progress:", error);
        return [];
      }

      console.log(
        `✅ Loaded ${data?.length || 0} daily progress entries from cloud`
      );
      return data || [];
    } catch (error) {
      console.error("❌ Error getting all daily progress:", error);
      return [];
    }
  },

  // =====================================================
  // USER GOALS SYNC
  // =====================================================
  async saveUserGoals(goals) {
    try {
      const userId = generateUserId();
      console.log(
        `💾 Saving ${
          goals?.length || 0
        } goals to cloud for user ${userId.substring(0, 8)}...`
      );
      const { data, error } = await supabase.from("user_goals").upsert(
        {
          user_id: userId,
          goals: goals,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;
      console.log("✅ Goals synced to cloud", goals);
      return data;
    } catch (error) {
      console.error("❌ Error saving goals:", error);
      throw error;
    }
  },

  async getUserGoals() {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase
        .from("user_goals")
        .select("goals")
        .eq("user_id", userId)
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 row

      if (error) {
        console.error("Error fetching goals:", error);
        return [];
      }

      console.log(`📥 Loaded ${data?.goals?.length || 0} goals from cloud`);
      return data?.goals || [];
    } catch (error) {
      console.error("❌ Error getting goals:", error);
      return [];
    }
  },

  // =====================================================
  // APP SETTINGS SYNC (quote index, etc.)
  // =====================================================
  async saveAppSettings(settings) {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase.from("app_settings").upsert(
        {
          user_id: userId,
          settings: settings,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;
      console.log("✅ App settings synced to cloud");
      return data;
    } catch (error) {
      console.error("❌ Error saving app settings:", error);
      throw error;
    }
  },

  async getAppSettings() {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase
        .from("app_settings")
        .select("settings")
        .eq("user_id", userId)
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 row

      if (error) {
        console.error("Error fetching app settings:", error);
        return {};
      }

      return data?.settings || {};
    } catch (error) {
      console.error("❌ Error getting app settings:", error);
      return {};
    }
  },

  // =====================================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================================
  subscribeToRoadmap(callback) {
    const userId = generateUserId();
    return supabase
      .channel("roadmap_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "roadmap",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔄 Roadmap updated from another device");
          callback(payload.new?.roadmap_data || null);
        }
      )
      .subscribe();
  },

  subscribeToTodayTasks(callback) {
    const userId = generateUserId();
    return supabase
      .channel("today_tasks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "today_tasks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔄 Tasks updated from another device");
          callback({
            tasks: payload.new?.tasks || [],
            completedOneTimeTasks: payload.new?.completed_one_time_tasks || [],
            lastResetDate: payload.new?.last_reset_date || null,
          });
        }
      )
      .subscribe();
  },

  subscribeToBooks(callback) {
    const userId = generateUserId();
    return supabase
      .channel("books_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "books",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔄 Books updated from another device");
          callback(payload.new?.books_data || []);
        }
      )
      .subscribe();
  },

  subscribeToGoals(callback) {
    const userId = generateUserId();
    return supabase
      .channel("goals_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_goals",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔄 Goals updated from another device");
          callback(payload.new?.goals || []);
        }
      )
      .subscribe();
  },

  // =====================================================
  // USER MANAGEMENT
  // =====================================================
  async createOrUpdateUser(userId, userName) {
    try {
      const { data, error } = await supabase.from("users").upsert(
        {
          user_id: userId,
          user_name: userName, // Changed from 'name' to 'user_name' to match database schema
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;
      console.log("✅ User created successfully in database");
      return data;
    } catch (error) {
      console.error("❌ Error creating user:", error);
      throw error;
    }
  },

  async getUser(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 row

      if (error) {
        console.error("Error fetching user:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("❌ Error getting user:", error);
      return null;
    }
  },

  // =====================================================
  // BULK SYNC (for initial load or full sync)
  // =====================================================
  async syncAll(allData) {
    try {
      // Sync all data in parallel for speed
      await Promise.all([
        allData.roadmap && this.saveRoadmap(allData.roadmap),
        allData.todayTasks &&
          this.saveTodayTasks(
            allData.todayTasks,
            allData.completedOneTimeTasks || [],
            allData.lastResetDate
          ),
        allData.books && this.saveBooks(allData.books),
        allData.pomodoroStats && this.savePomodoroStats(allData.pomodoroStats),
        allData.goals && this.saveUserGoals(allData.goals),
        allData.appSettings && this.saveAppSettings(allData.appSettings),
      ]);

      console.log("✅ All data synced to cloud");
      return true;
    } catch (error) {
      console.error("❌ Error syncing all data:", error);
      throw error;
    }
  },

  async loadAll() {
    try {
      console.log("📥 Loading all data from Supabase...");

      // Load all data in parallel for speed
      const [
        roadmap,
        todayTasksData,
        books,
        pomodoroStats,
        goals,
        appSettings,
        dailyProgressEntries,
      ] = await Promise.all([
        this.getRoadmap(),
        this.getTodayTasks(),
        this.getBooks(),
        this.getPomodoroStats(),
        this.getUserGoals(),
        this.getAppSettings(),
        this.getAllDailyProgress(),
      ]);

      console.log("✅ All data loaded from cloud:", {
        roadmap: roadmap ? "exists" : "null",
        tasks: todayTasksData.tasks?.length || 0,
        books: books?.length || 0,
        goals: goals?.length || 0,
        pomodoroStats: pomodoroStats ? "exists" : "null",
        dailyProgress: dailyProgressEntries?.length || 0,
      });

      return {
        roadmap,
        todayTasks: todayTasksData, // This already has {tasks, completedOneTimeTasks, lastResetDate}
        books,
        pomodoroStats,
        goals,
        appSettings,
        dailyProgress: dailyProgressEntries,
      };
    } catch (error) {
      console.error("❌ Error loading all data:", error);
      throw error;
    }
  },
};
