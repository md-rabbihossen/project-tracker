// Pomodoro Statistics Utility Functions

// Get current date in YYYY-MM-DD format (timezone-safe)
export const getCurrentDate = () => {
  const today = new Date();
  // Use local timezone instead of UTC to avoid timezone issues
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  const localDate = `${year}-${month}-${day}`;

  console.log(`📅 Current date (local timezone): ${localDate}`);
  return localDate;
};

// Get current week start date (Saturday) - timezone-safe
export const getWeekStartDate = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToSaturday = dayOfWeek === 6 ? 0 : (dayOfWeek + 1) % 7; // Days to go back to Saturday
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysToSaturday);

  // Use local timezone instead of UTC
  const year = saturday.getFullYear();
  const month = (saturday.getMonth() + 1).toString().padStart(2, "0");
  const day = saturday.getDate().toString().padStart(2, "0");
  const weekStart = `${year}-${month}-${day}`;

  console.log(
    `📅 Current week starts on Saturday: ${weekStart} (today is ${getCurrentDate()})`
  );
  return weekStart;
};

// Get current month in YYYY-MM format
export const getCurrentMonth = () => {
  const today = new Date();
  return `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
};

// Initialize stats structure
export const initializePomodoroStats = () => {
  const stats = {
    daily: {}, // { "2025-08-19": { minutes: 150, sessions: 6, labels: { study: 90, programming: 60 } } }
    weekly: {}, // { "2025-08-17": { minutes: 1200, sessions: 48, labels: { study: 720, programming: 480 } } } // Saturday dates as keys
    monthly: {}, // { "2025-08": { minutes: 5400, sessions: 216, labels: { study: 3240, programming: 2160 } } }
    lifetime: {
      totalMinutes: 0,
      totalSessions: 0,
      startDate: getCurrentDate(),
      labels: {}, // { study: 5400, programming: 3600, other: 1800 }
    },
    goals: {
      dailyMinutes: 120, // 2 hours default
      weeklyMinutes: 600, // 10 hours default
      monthlyMinutes: 2400, // 40 hours default (roughly 10 hours per week * 4 weeks)
    },
    labels: ["study", "programming", "other"], // Available labels
    previousPeriods: {
      previousDay: {},
      previousWeek: {},
      previousMonth: {},
    },
    bestRecords: {
      bestDay: { minutes: 0, date: "", sessions: 0 }, // Best single day
      bestWeek: { minutes: 0, weekStart: "", sessions: 0 }, // Best week
      bestMonth: { minutes: 0, month: "", sessions: 0 }, // Best month
    },
  };
  return stats;
};

// Get stats from localStorage or initialize
export const getPomodoroStats = () => {
  const stored = localStorage.getItem("pomodoroStats");
  if (stored) {
    try {
      const stats = JSON.parse(stored);
      // Ensure goals exist (backward compatibility)
      if (!stats.goals) {
        stats.goals = {
          dailyMinutes: 120,
          weeklyMinutes: 600,
          monthlyMinutes: 2400,
        };
      }
      // Ensure monthly goal exists (backward compatibility)
      if (!stats.goals.monthlyMinutes) {
        stats.goals.monthlyMinutes = 2400;
      }
      // Ensure labels exist (backward compatibility)
      if (!stats.labels) {
        stats.labels = ["study", "programming", "other"];
      }
      // Ensure previousPeriods exist (backward compatibility)
      if (!stats.previousPeriods) {
        stats.previousPeriods = {
          previousDay: {},
          previousWeek: {},
          previousMonth: {},
        };
      }
      // Ensure lifetime labels exist (backward compatibility)
      if (!stats.lifetime.labels) {
        stats.lifetime.labels = {};
      }
      // Ensure bestRecords exist (backward compatibility)
      if (!stats.bestRecords) {
        stats.bestRecords = {
          bestDay: { minutes: 0, date: "", sessions: 0 },
          bestWeek: { minutes: 0, weekStart: "", sessions: 0 },
          bestMonth: { minutes: 0, month: "", sessions: 0 },
        };
      }
      // Ensure timestamped sessions exist (backward compatibility)
      if (!stats.timestampedSessions) {
        stats.timestampedSessions = [];
      }
      return stats;
    } catch (error) {
      console.error("Error parsing pomodoro stats:", error);
      return initializePomodoroStats();
    }
  }
  return initializePomodoroStats();
};

// Get all current stats (daily, weekly, monthly) with proper initialization
export const getAllCurrentStats = () => {
  const stats = getPomodoroStats();
  const today = getCurrentDate();
  const thisWeek = getWeekStartDate();
  const thisMonth = getCurrentMonth();

  // Initialize all current periods if they don't exist
  let needsSave = false;

  // Ensure today's stats exist
  if (!stats.daily[today]) {
    stats.daily[today] = { minutes: 0, sessions: 0, labels: {} };
    needsSave = true;
  }

  // Ensure this week's stats exist
  if (!stats.weekly[thisWeek]) {
    stats.weekly[thisWeek] = { minutes: 0, sessions: 0, labels: {} };
    needsSave = true;
  }

  // Ensure this month's stats exist
  if (!stats.monthly[thisMonth]) {
    stats.monthly[thisMonth] = { minutes: 0, sessions: 0, labels: {} };
    needsSave = true;
  }

  // Save if any initialization was needed
  if (needsSave) {
    savePomodoroStats(stats);
    console.log("📊 Initialized missing stats periods:", {
      today,
      thisWeek,
      thisMonth,
    });
  }

  return {
    daily: stats.daily[today],
    weekly: stats.weekly[thisWeek],
    monthly: stats.monthly[thisMonth],
  };
};

// Save stats to localStorage
export const savePomodoroStats = (stats) => {
  localStorage.setItem("pomodoroStats", JSON.stringify(stats));

  // Trigger sync to Supabase if function is available
  if (typeof window !== "undefined" && window.triggerDataSync) {
    console.log("📡 Triggering Supabase sync for pomodoro stats...");
    setTimeout(() => window.triggerDataSync(), 500); // Small delay to batch multiple updates
  }
};

// Update goals
export const updatePomodoroGoals = (
  dailyMinutes,
  weeklyMinutes,
  monthlyMinutes
) => {
  const stats = getPomodoroStats();
  stats.goals = {
    dailyMinutes: Math.max(30, dailyMinutes), // Minimum 30 minutes
    weeklyMinutes: Math.max(180, weeklyMinutes), // Minimum 3 hours
    monthlyMinutes: Math.max(720, monthlyMinutes), // Minimum 12 hours
  };
  savePomodoroStats(stats);
  return stats;
};

// Get current goals
export const getPomodoroGoals = () => {
  const stats = getPomodoroStats();
  return (
    stats.goals || {
      dailyMinutes: 120,
      weeklyMinutes: 600,
      monthlyMinutes: 2400,
    }
  );
};

// Add time to statistics when timer is reset/completed
export const addPomodoroTime = (minutes, label = "study", sessionCount = 1) => {
  const stats = getPomodoroStats();
  const today = getCurrentDate();
  const thisWeek = getWeekStartDate();
  const thisMonth = getCurrentMonth();
  const timestamp = new Date().toISOString();

  console.log(
    `📊 Adding ${minutes} minutes of '${label}' (${sessionCount} sessions) to stats for ${today}`
  );
  console.log(`📅 Current week: ${thisWeek}, Current month: ${thisMonth}`);

  // Initialize timestamped sessions array if it doesn't exist
  if (!stats.timestampedSessions) {
    stats.timestampedSessions = [];
  }

  // Add timestamped session for accurate 6-hour tracking
  stats.timestampedSessions.push({
    timestamp: timestamp,
    minutes: minutes,
    label: label,
    date: today,
    sessionCount: sessionCount, // Track number of sessions
  });

  // Clean up sessions older than 7 days to prevent excessive storage
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  stats.timestampedSessions = stats.timestampedSessions.filter(
    (session) => new Date(session.timestamp) > sevenDaysAgo
  );

  // Update daily stats
  if (!stats.daily[today]) {
    stats.daily[today] = { minutes: 0, sessions: 0, labels: {} };
  }
  // Ensure labels object exists (backward compatibility)
  if (!stats.daily[today].labels) {
    stats.daily[today].labels = {};
  }
  stats.daily[today].minutes += minutes;
  stats.daily[today].sessions += sessionCount; // Add session count instead of always 1
  stats.daily[today].labels[label] =
    (stats.daily[today].labels[label] || 0) + minutes;

  // Update weekly stats
  if (!stats.weekly[thisWeek]) {
    stats.weekly[thisWeek] = { minutes: 0, sessions: 0, labels: {} };
  }
  // Ensure labels object exists (backward compatibility)
  if (!stats.weekly[thisWeek].labels) {
    stats.weekly[thisWeek].labels = {};
  }
  stats.weekly[thisWeek].minutes += minutes;
  stats.weekly[thisWeek].sessions += sessionCount; // Add session count instead of always 1
  stats.weekly[thisWeek].labels[label] =
    (stats.weekly[thisWeek].labels[label] || 0) + minutes;

  // Update monthly stats
  if (!stats.monthly[thisMonth]) {
    stats.monthly[thisMonth] = { minutes: 0, sessions: 0, labels: {} };
  }
  // Ensure labels object exists (backward compatibility)
  if (!stats.monthly[thisMonth].labels) {
    stats.monthly[thisMonth].labels = {};
  }
  stats.monthly[thisMonth].minutes += minutes;
  stats.monthly[thisMonth].sessions += sessionCount; // Add session count instead of always 1
  stats.monthly[thisMonth].labels[label] =
    (stats.monthly[thisMonth].labels[label] || 0) + minutes;

  // Update lifetime stats
  stats.lifetime.totalMinutes += minutes;
  stats.lifetime.totalSessions += sessionCount; // Add session count instead of always 1
  stats.lifetime.labels[label] = (stats.lifetime.labels[label] || 0) + minutes;

  console.log(`📊 Updated stats:`, {
    daily: stats.daily[today],
    weekly: stats.weekly[thisWeek],
    monthly: stats.monthly[thisMonth],
  });

  savePomodoroStats(stats);

  // Check for new best records after adding time
  updateBestRecords(
    stats.daily[today],
    stats.weekly[thisWeek],
    stats.monthly[thisMonth]
  );

  return stats;
};

// Get today's stats
export const getTodayStats = () => {
  const stats = getPomodoroStats();
  const today = getCurrentDate();
  const todayStats = stats.daily[today] || {
    minutes: 0,
    sessions: 0,
    labels: {},
  };

  // Ensure labels object exists (backward compatibility)
  if (!todayStats.labels) {
    todayStats.labels = {};
  }

  return todayStats;
};

// Get this week's stats
export const getThisWeekStats = () => {
  const stats = getPomodoroStats();
  const thisWeek = getWeekStartDate();

  // Ensure this week's stats exist
  if (!stats.weekly[thisWeek]) {
    stats.weekly[thisWeek] = { minutes: 0, sessions: 0, labels: {} };
    // Don't save here to avoid potential race conditions during page load
  }

  const weekStats = stats.weekly[thisWeek];

  // Ensure labels object exists (backward compatibility)
  if (!weekStats.labels) {
    weekStats.labels = {};
  }

  console.log(`📊 Getting week stats for ${thisWeek}:`, weekStats);
  return weekStats;
};

// Get this month's stats
export const getThisMonthStats = () => {
  const stats = getPomodoroStats();
  const thisMonth = getCurrentMonth();

  // Ensure this month's stats exist
  if (!stats.monthly[thisMonth]) {
    stats.monthly[thisMonth] = { minutes: 0, sessions: 0, labels: {} };
    // Don't save here to avoid potential race conditions during page load
  }

  const monthStats = stats.monthly[thisMonth];

  // Ensure labels object exists (backward compatibility)
  if (!monthStats.labels) {
    monthStats.labels = {};
  }

  console.log(`📊 Getting month stats for ${thisMonth}:`, monthStats);
  return monthStats;
};

// Get lifetime stats
export const getLifetimeStats = () => {
  const stats = getPomodoroStats();
  const lifetimeStats = stats.lifetime;

  // Ensure labels object exists (backward compatibility)
  if (!lifetimeStats.labels) {
    lifetimeStats.labels = {};
  }

  return lifetimeStats;
};

// Add manual time (from the Add Time button)
export const addManualTime = (
  hours,
  minutes,
  label = "study",
  sessionCount = 1
) => {
  const totalMinutes = hours * 60 + minutes;
  const result = addPomodoroTime(totalMinutes, label, sessionCount);

  // Check for new records after manual time addition
  checkAndUpdateRecords();

  return result;
};

// Get available labels
export const getAvailableLabels = () => {
  const stats = getPomodoroStats();
  return stats.labels || ["study", "programming", "other"];
};

// Add new label
export const addLabel = (newLabel) => {
  const stats = getPomodoroStats();
  if (!stats.labels) {
    stats.labels = ["study", "programming", "other"];
  }

  const normalizedLabel = newLabel.toLowerCase().trim();
  if (normalizedLabel && !stats.labels.includes(normalizedLabel)) {
    stats.labels.push(normalizedLabel);
    savePomodoroStats(stats);
  }
  return stats.labels;
};

// Remove label
export const removeLabel = (labelToRemove) => {
  const stats = getPomodoroStats();
  if (!stats.labels) {
    stats.labels = ["study", "programming", "other"];
  }

  // Don't allow removing if it's the last label
  if (stats.labels.length <= 1) {
    return stats.labels;
  }

  stats.labels = stats.labels.filter((label) => label !== labelToRemove);
  savePomodoroStats(stats);
  return stats.labels;
};

// Get previous day's stats
export const getPreviousDayStats = () => {
  const stats = getPomodoroStats();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Use local timezone for consistency
  const year = yesterday.getFullYear();
  const month = (yesterday.getMonth() + 1).toString().padStart(2, "0");
  const day = yesterday.getDate().toString().padStart(2, "0");
  const yesterdayStr = `${year}-${month}-${day}`;
  const todayStr = getCurrentDate();

  console.log(`📊 Looking for previous day stats:`, {
    today: todayStr,
    yesterday: yesterdayStr,
    availableDays: Object.keys(stats.daily),
    yesterdayData: stats.daily[yesterdayStr],
  });

  const previousDayStats = stats.daily[yesterdayStr] || {
    minutes: 0,
    sessions: 0,
    labels: {},
  };

  // Ensure labels object exists (backward compatibility)
  if (!previousDayStats.labels) {
    previousDayStats.labels = {};
  }

  console.log(`📊 Previous day (${yesterdayStr}) stats:`, previousDayStats);
  return previousDayStats;
};

// Get previous week's stats
export const getPreviousWeekStats = () => {
  const stats = getPomodoroStats();
  const currentWeekStart = getWeekStartDate();

  // Get previous week start date
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  // Use local timezone for consistency
  const year = previousWeekStart.getFullYear();
  const month = (previousWeekStart.getMonth() + 1).toString().padStart(2, "0");
  const day = previousWeekStart.getDate().toString().padStart(2, "0");
  const previousWeekKey = `${year}-${month}-${day}`;

  console.log(`📊 Looking for previous week stats:`, {
    currentWeek: currentWeekStart,
    previousWeek: previousWeekStart.toDateString(),
    previousWeekKey,
    availableWeeks: Object.keys(stats.weekly),
    previousWeekData: stats.weekly[previousWeekKey],
  });

  const previousWeekStats = stats.weekly[previousWeekKey] || {
    minutes: 0,
    sessions: 0,
    labels: {},
  };

  // Ensure labels object exists (backward compatibility)
  if (!previousWeekStats.labels) {
    previousWeekStats.labels = {};
  }

  console.log(
    `📊 Previous week (${previousWeekKey}) stats:`,
    previousWeekStats
  );
  return previousWeekStats;
};

// Get previous month's stats
export const getPreviousMonthStats = () => {
  const stats = getPomodoroStats();
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthStr = `${previousMonth.getFullYear()}-${(
    previousMonth.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}`;
  const previousMonthStats = stats.monthly[previousMonthStr] || {
    minutes: 0,
    sessions: 0,
    labels: {},
  };

  // Ensure labels object exists (backward compatibility)
  if (!previousMonthStats.labels) {
    previousMonthStats.labels = {};
  }

  return previousMonthStats;
};

// Helper function to get week start date from any date (Saturday)
export const getWeekStartDateFromDate = (date) => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToSaturday = dayOfWeek === 6 ? 0 : (dayOfWeek + 1) % 7; // Days to go back to Saturday
  const saturday = new Date(date);
  saturday.setDate(date.getDate() - daysToSaturday);
  return saturday.toISOString().split("T")[0];
};

// Clean up old daily stats (keep only last 30 days)
// Track if cleanup has been performed in this session
let cleanupPerformed = false;

export const cleanupOldStats = () => {
  // Only run cleanup once per session
  if (cleanupPerformed) {
    return;
  }

  const stats = getPomodoroStats();
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0];

  let hasChanges = false;

  // Clean daily stats
  Object.keys(stats.daily).forEach((date) => {
    if (date < cutoffDate) {
      delete stats.daily[date];
      hasChanges = true;
    }
  });

  // Clean weekly stats (keep only last 12 weeks)
  const twelveWeeksAgo = new Date(
    today.getTime() - 12 * 7 * 24 * 60 * 60 * 1000
  );
  const weekCutoffDate = getWeekStartDateFromDate(twelveWeeksAgo);

  Object.keys(stats.weekly).forEach((date) => {
    if (date < weekCutoffDate) {
      delete stats.weekly[date];
      hasChanges = true;
    }
  });

  // Clean monthly stats (keep only last 12 months)
  const twelveMonthsAgo = new Date(
    today.getFullYear(),
    today.getMonth() - 12,
    1
  );
  const monthCutoff = `${twelveMonthsAgo.getFullYear()}-${(
    twelveMonthsAgo.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}`;

  Object.keys(stats.monthly).forEach((month) => {
    if (month < monthCutoff) {
      delete stats.monthly[month];
      hasChanges = true;
    }
  });

  // Ensure current periods are initialized
  const currentWeekKey = getWeekStartDate();
  const currentMonthKey = getCurrentMonth();

  if (!stats.weekly[currentWeekKey]) {
    stats.weekly[currentWeekKey] = { minutes: 0, sessions: 0, labels: {} };
    hasChanges = true;
    console.log(`📅 Initialized current week ${currentWeekKey} during cleanup`);
  }

  if (!stats.monthly[currentMonthKey]) {
    stats.monthly[currentMonthKey] = { minutes: 0, sessions: 0, labels: {} };
    hasChanges = true;
    console.log(
      `📅 Initialized current month ${currentMonthKey} during cleanup`
    );
  }

  // Only save if we actually cleaned up something or initialized new periods
  if (hasChanges) {
    savePomodoroStats(stats);
    console.log("🧹 Completed Pomodoro stats cleanup and initialization");
  }

  // Mark cleanup as performed for this session
  cleanupPerformed = true;
};

// Format minutes to hours and minutes
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
};

// Check if we need to reset weekly stats (when week changes from Friday to Saturday)
export const checkAndResetWeeklyStats = () => {
  const stats = getPomodoroStats();
  const currentWeekKey = getWeekStartDate();

  // Check if we have any weekly stats yet
  if (!stats.weekly[currentWeekKey]) {
    // This is a new week, initialize it
    stats.weekly[currentWeekKey] = { minutes: 0, sessions: 0, labels: {} };
    savePomodoroStats(stats);
  }

  return stats;
};

// Check if we need to reset monthly stats (when month changes)
export const checkAndResetMonthlyStats = () => {
  const stats = getPomodoroStats();
  const currentMonthKey = getCurrentMonth();

  // Check if we have any monthly stats yet
  if (!stats.monthly[currentMonthKey]) {
    // This is a new month, initialize it
    stats.monthly[currentMonthKey] = { minutes: 0, sessions: 0, labels: {} };
    savePomodoroStats(stats);
  }

  return stats;
};

// Reset daily stats (called when day changes)
export const resetDailyPomodoroStats = () => {
  const stats = getPomodoroStats();
  const today = getCurrentDate();
  const currentWeekKey = getWeekStartDate();
  const currentMonthKey = getCurrentMonth();

  // Archive current day's stats in history if there's any data
  if (stats.daily[today] && stats.daily[today].minutes > 0) {
    console.log(
      `📊 Archiving Pomodoro stats for ${today}:`,
      stats.daily[today]
    );
    // Data is already saved in stats.daily[today] - no need to move it
    // The getPreviousDayStats function will retrieve it correctly
  }

  // Important: Only reset today's stats to zero, keep all other days intact
  stats.daily[today] = { minutes: 0, sessions: 0, labels: {} };

  // Ensure weekly stats structure exists (DO NOT reset weekly stats)
  if (!stats.weekly[currentWeekKey]) {
    stats.weekly[currentWeekKey] = { minutes: 0, sessions: 0, labels: {} };
    console.log(`📅 Initialized new week tracking for ${currentWeekKey}`);
  }

  // Ensure monthly stats structure exists (DO NOT reset monthly stats)
  if (!stats.monthly[currentMonthKey]) {
    stats.monthly[currentMonthKey] = { minutes: 0, sessions: 0, labels: {} };
    console.log(`📅 Initialized new month tracking for ${currentMonthKey}`);
  }

  savePomodoroStats(stats);
  console.log("🔄 Daily Pomodoro statistics reset for new day");
  console.log(`📊 Weekly stats preserved for ${currentWeekKey}`);
  console.log(`📊 Monthly stats preserved for ${currentMonthKey}`);

  return stats;
};

// Reset stats (for testing purposes)
export const resetPomodoroStats = () => {
  localStorage.removeItem("pomodoroStats");
  return initializePomodoroStats();
};

// Custom Time Presets Management
const PRESET_STORAGE_KEY = "pomodoroTimePresets";

// Get custom time presets from localStorage
export const getCustomTimePresets = () => {
  const stored = localStorage.getItem(PRESET_STORAGE_KEY);
  if (stored) {
    try {
      const presets = JSON.parse(stored);
      // Ensure we always have the default presets
      const defaultPresets = [
        { minutes: 25, emoji: "🍅", label: "25min" },
        { minutes: 30, emoji: "⭐", label: "30min" }, // New default
        { minutes: 45, emoji: "📚", label: "45min" },
        { minutes: 90, emoji: "🎯", label: "90min" },
      ];

      // Merge with stored presets, avoiding duplicates
      const mergedPresets = [...defaultPresets];
      presets.forEach((preset) => {
        if (!defaultPresets.some((dp) => dp.minutes === preset.minutes)) {
          mergedPresets.push(preset);
        }
      });

      return mergedPresets;
    } catch (error) {
      console.error("Error parsing custom time presets:", error);
    }
  }

  // Return default presets if no stored data
  return [
    { minutes: 25, emoji: "🍅", label: "25min" },
    { minutes: 30, emoji: "⭐", label: "30min" }, // New default
    { minutes: 45, emoji: "📚", label: "45min" },
    { minutes: 90, emoji: "🎯", label: "90min" },
  ];
};

// Save custom time presets to localStorage
export const saveCustomTimePresets = (presets) => {
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
};

// Add new custom time preset
export const addCustomTimePreset = (minutes, emoji = "⏰", label = null) => {
  const presets = getCustomTimePresets();
  const displayLabel = label || `${minutes}min`;

  // Check if preset already exists
  if (presets.some((preset) => preset.minutes === minutes)) {
    return presets; // Don't add duplicate
  }

  const newPreset = {
    minutes: parseInt(minutes),
    emoji: emoji,
    label: displayLabel,
    isCustom: true, // Mark as custom so it can be removed
  };

  const updatedPresets = [...presets, newPreset];
  saveCustomTimePresets(updatedPresets);
  return updatedPresets;
};

// Remove custom time preset
export const removeCustomTimePreset = (minutes) => {
  const presets = getCustomTimePresets();
  const defaultMinutes = [25, 30, 45, 90]; // Don't allow removing defaults

  if (defaultMinutes.includes(parseInt(minutes))) {
    return presets; // Don't remove default presets
  }

  const updatedPresets = presets.filter((preset) => preset.minutes !== minutes);
  saveCustomTimePresets(updatedPresets);
  return updatedPresets;
};

// Get best records (daily, weekly, monthly)
export const getBestRecords = () => {
  const stats = getPomodoroStats();
  return (
    stats.bestRecords || {
      bestDay: { minutes: 0, date: "", sessions: 0 },
      bestWeek: { minutes: 0, weekStart: "", sessions: 0 },
      bestMonth: { minutes: 0, month: "", sessions: 0 },
    }
  );
};

// Update best records when new records are achieved
export const updateBestRecords = (currentDay, currentWeek, currentMonth) => {
  const stats = getPomodoroStats();

  // Ensure bestRecords exist
  if (!stats.bestRecords) {
    stats.bestRecords = {
      bestDay: { minutes: 0, date: "", sessions: 0 },
      bestWeek: { minutes: 0, weekStart: "", sessions: 0 },
      bestMonth: { minutes: 0, month: "", sessions: 0 },
    };
  }

  let recordsUpdated = false;

  // Check and update best day
  if (currentDay.minutes > stats.bestRecords.bestDay.minutes) {
    stats.bestRecords.bestDay = {
      minutes: currentDay.minutes,
      date: getCurrentDate(),
      sessions: currentDay.sessions,
    };
    recordsUpdated = true;
    console.log(
      `🏆 New best day record! ${
        currentDay.minutes
      } minutes on ${getCurrentDate()}`
    );
  }

  // Check and update best week
  if (currentWeek.minutes > stats.bestRecords.bestWeek.minutes) {
    stats.bestRecords.bestWeek = {
      minutes: currentWeek.minutes,
      weekStart: getWeekStartDate(),
      sessions: currentWeek.sessions,
    };
    recordsUpdated = true;
    console.log(
      `🏆 New best week record! ${
        currentWeek.minutes
      } minutes for week starting ${getWeekStartDate()}`
    );
  }

  // Check and update best month
  if (currentMonth.minutes > stats.bestRecords.bestMonth.minutes) {
    stats.bestRecords.bestMonth = {
      minutes: currentMonth.minutes,
      month: getCurrentMonth(),
      sessions: currentMonth.sessions,
    };
    recordsUpdated = true;
    console.log(
      `🏆 New best month record! ${
        currentMonth.minutes
      } minutes for ${getCurrentMonth()}`
    );
  }

  if (recordsUpdated) {
    savePomodoroStats(stats);
  }

  return stats.bestRecords;
};

// Check for record updates (call this when stats are updated)
export const checkAndUpdateRecords = () => {
  const currentStats = getAllCurrentStats();
  return updateBestRecords(
    currentStats.daily,
    currentStats.weekly,
    currentStats.monthly
  );
};

// Get stats for the last 6 hours
export const getLast6HoursStats = () => {
  const stats = getPomodoroStats();
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  let totalMinutes = 0;
  let totalSessions = 0;
  const labels = {};

  // Initialize timestamped sessions array if it doesn't exist
  if (!stats.timestampedSessions) {
    stats.timestampedSessions = [];
  }

  // Filter sessions from the last 6 hours using actual timestamps
  const recentSessions = stats.timestampedSessions.filter((session) => {
    const sessionTime = new Date(session.timestamp);
    return sessionTime >= sixHoursAgo && sessionTime <= now;
  });

  // Calculate totals from actual sessions
  recentSessions.forEach((session) => {
    totalMinutes += session.minutes;
    totalSessions += 1;

    // Track by label
    const label = session.label || "study";
    labels[label] = (labels[label] || 0) + session.minutes;
  });

  console.log(
    `📊 Last 6 hours: Found ${recentSessions.length} sessions, ${totalMinutes} total minutes`
  );

  return {
    minutes: totalMinutes,
    sessions: totalSessions,
    labels: labels,
  };
};
