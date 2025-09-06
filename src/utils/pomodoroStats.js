// Pomodoro Statistics Utility Functions

// Get current date in YYYY-MM-DD format
export const getCurrentDate = () => {
  return new Date().toISOString().split("T")[0];
};

// Get current week start date (Saturday)
export const getWeekStartDate = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToSaturday = dayOfWeek === 6 ? 0 : (dayOfWeek + 1) % 7; // Days to go back to Saturday
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysToSaturday);
  const weekStart = saturday.toISOString().split("T")[0];
  console.log(
    `📅 Current week starts on Saturday: ${weekStart} (today is ${
      today.toISOString().split("T")[0]
    })`
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

  // Trigger Firebase sync if user is authenticated
  if (window.syncToFirebase && typeof window.syncToFirebase === "function") {
    try {
      window.syncToFirebase();
    } catch (error) {
      console.warn("Firebase sync failed for Pomodoro stats:", error);
    }
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
export const addPomodoroTime = (minutes, label = "study") => {
  const stats = getPomodoroStats();
  const today = getCurrentDate();
  const thisWeek = getWeekStartDate();
  const thisMonth = getCurrentMonth();

  console.log(
    `📊 Adding ${minutes} minutes of '${label}' to stats for ${today}`
  );
  console.log(`📅 Current week: ${thisWeek}, Current month: ${thisMonth}`);

  // Update daily stats
  if (!stats.daily[today]) {
    stats.daily[today] = { minutes: 0, sessions: 0, labels: {} };
  }
  // Ensure labels object exists (backward compatibility)
  if (!stats.daily[today].labels) {
    stats.daily[today].labels = {};
  }
  stats.daily[today].minutes += minutes;
  stats.daily[today].sessions += 1;
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
  stats.weekly[thisWeek].sessions += 1;
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
  stats.monthly[thisMonth].sessions += 1;
  stats.monthly[thisMonth].labels[label] =
    (stats.monthly[thisMonth].labels[label] || 0) + minutes;

  // Update lifetime stats
  stats.lifetime.totalMinutes += minutes;
  stats.lifetime.totalSessions += 1;
  stats.lifetime.labels[label] = (stats.lifetime.labels[label] || 0) + minutes;

  console.log(`📊 Updated stats:`, {
    daily: stats.daily[today],
    weekly: stats.weekly[thisWeek],
    monthly: stats.monthly[thisMonth],
  });

  savePomodoroStats(stats);
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
export const addManualTime = (hours, minutes, label = "study") => {
  const totalMinutes = hours * 60 + minutes;
  return addPomodoroTime(totalMinutes, label);
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
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const previousDayStats = stats.daily[yesterdayStr] || {
    minutes: 0,
    sessions: 0,
    labels: {},
  };

  // Ensure labels object exists (backward compatibility)
  if (!previousDayStats.labels) {
    previousDayStats.labels = {};
  }

  return previousDayStats;
};

// Get previous week's stats
export const getPreviousWeekStats = () => {
  const stats = getPomodoroStats();
  const previousWeek = new Date();
  previousWeek.setDate(previousWeek.getDate() - 7);
  const previousWeekStart = getWeekStartDateFromDate(previousWeek);

  const previousWeekStats = stats.weekly[previousWeekStart] || {
    minutes: 0,
    sessions: 0,
    labels: {},
  };

  // Ensure labels object exists (backward compatibility)
  if (!previousWeekStats.labels) {
    previousWeekStats.labels = {};
  }

  console.log(
    `📊 Previous week (${previousWeekStart}):`,
    previousWeekStats.minutes,
    "minutes"
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
  }

  // Reset today's stats to zero
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
