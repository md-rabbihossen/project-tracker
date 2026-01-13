import { motion } from "framer-motion";
import {
  Check,
  Clock,
  Edit2,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  addLabel,
  addManualTime,
  cleanupOldStats,
  formatDuration,
  getAllCurrentStats,
  getAvailableLabels,
  getBestRecords,
  getLifetimeStats,
  getPomodoroGoals,
  getPreviousDayStats,
  getPreviousMonthStats,
  getPreviousWeekStats,
  getWeeklyAveragePerDay,
  removeLabel,
  updatePomodoroGoals,
} from "../../utils/pomodoroStats";
import { ProgressBar } from "../common/ProgressBar";
import { AddGoalModal, GoalCard } from "../goals/GoalComponents";
import { AddTimeModal } from "../timer/AddTimeModal";
import AdvancedAnalytics from "./AdvancedAnalytics";
import ProductivityInsights from "./ProductivityInsights";
import TimeComparisonDashboard from "./TimeComparisonDashboard";

// Helper function to calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (previous === 0 && current === 0)
    return { percentage: 0, isPositive: null };
  if (previous === 0) return { percentage: 100, isPositive: true };

  const change = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(Math.round(change)),
    isPositive: change >= 0,
  };
};

// Progress Indicator Component
const ProgressIndicator = ({ current, previous, className = "" }) => {
  const { percentage, isPositive } = calculatePercentageChange(
    current,
    previous
  );

  if (percentage === 0 && isPositive === null) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {isPositive ? (
        <TrendingUp size={14} className="text-green-600" />
      ) : (
        <TrendingDown size={14} className="text-red-600" />
      )}
      <span
        className={`text-xs font-medium ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {percentage}%
      </span>
    </div>
  );
};

// Best Record Card Component with Beautiful Design
const BestRecordCard = ({ title, record, color, formatDate }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-white/50 relative overflow-hidden hover:shadow-xl transition-all`}
  >
    <div className="absolute top-3 right-3">
      <div className="text-3xl">🏆</div>
    </div>
    <h4 className="font-bold text-gray-800 mb-3 text-base">{title}</h4>
    {record.minutes > 0 ? (
      <>
        <div
          className={`text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r ${color
            .replace("border-", "from-")
            .replace("-200", "-500")} ${color
            .replace("border-", "to-")
            .replace("-200", "-600")}`}
        >
          {formatDuration(record.minutes)}
        </div>
        <div className="text-sm text-gray-700 space-y-1 font-medium">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></span>
            {record.sessions} sessions
          </p>
          <p className="text-xs text-gray-600">{formatDate(record)}</p>
        </div>
      </>
    ) : (
      <div className="text-gray-400 text-sm py-4 font-medium">
        No record yet - Start tracking!
      </div>
    )}
  </motion.div>
);

export const PomodoroAnalytics = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [stats, setStats] = useState({
    today: { minutes: 0, sessions: 0, labels: {} },
    week: { minutes: 0, sessions: 0, labels: {} },
    month: { minutes: 0, sessions: 0, labels: {} },
    lifetime: { totalMinutes: 0, totalSessions: 0, startDate: "", labels: {} },
  });

  // Helper function to calculate grade based on percentage
  const calculateGrade = (percentage) => {
    if (percentage >= 80) return "A+";
    if (percentage >= 75) return "A";
    if (percentage >= 70) return "A-";
    if (percentage >= 65) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 55) return "B-";
    if (percentage >= 50) return "C+";
    if (percentage >= 45) return "C";
    if (percentage >= 40) return "D";
    return "F";
  };

  const [weeklyAverage, setWeeklyAverage] = useState({
    averageMinutes: 0,
    totalMinutes: 0,
    daysPassed: 0,
    totalSessions: 0,
    labels: {},
  });

  const [previousStats, setPreviousStats] = useState({
    previousDay: { minutes: 0, sessions: 0, labels: {} },
    previousWeek: { minutes: 0, sessions: 0, labels: {} },
    previousMonth: { minutes: 0, sessions: 0, labels: {} },
  });

  const [goals, setGoals] = useState({
    dailyMinutes: 120,
    weeklyMinutes: 600,
    monthlyMinutes: 2400,
  });

  const [editingGoals, setEditingGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState({
    dailyMinutes: 120,
    weeklyMinutes: 600,
    monthlyMinutes: 2400,
  });

  const [availableLabels, setAvailableLabels] = useState([
    "study",
    "programming",
    "other",
  ]);
  const [showAddTimeModal, setShowAddTimeModal] = useState(false);

  // User Goals state (different from Pomodoro goals)
  const [userGoals, setUserGoals] = useState([]);
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false);

  // Best Records state
  const [bestRecords, setBestRecords] = useState({
    bestDay: { minutes: 0, date: "", sessions: 0 },
    bestWeek: { minutes: 0, weekStart: "", sessions: 0 },
    bestMonth: { minutes: 0, month: "", sessions: 0 },
  });

  // User Goals functions
  const loadUserGoals = () => {
    const saved = localStorage.getItem("userGoals");
    if (saved) {
      setUserGoals(JSON.parse(saved));
    }
  };

  const saveUserGoals = (goals) => {
    localStorage.setItem("userGoals", JSON.stringify(goals));
    setUserGoals(goals);
  };

  const addUserGoal = (goal) => {
    const newGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString(),
      current: 0, // Add current progress property
    };
    const updatedGoals = [...userGoals, newGoal];
    saveUserGoals(updatedGoals);
  };

  const updateUserGoal = (updatedGoal) => {
    const updatedGoals = userGoals.map((goal) =>
      goal.id === updatedGoal.id ? updatedGoal : goal
    );
    saveUserGoals(updatedGoals);
  };

  const deleteUserGoal = (goalId) => {
    const updatedGoals = userGoals.filter((goal) => goal.id !== goalId);
    saveUserGoals(updatedGoals);
  };

  useEffect(() => {
    // Clean up old stats and load current stats
    cleanupOldStats();

    // Load stats with a small delay to ensure data structures are ready
    const loadStatsWithDelay = () => {
      setTimeout(() => {
        loadStats();
        loadGoals();
        loadLabels();
        loadUserGoals();
        loadBestRecords();
      }, 100);
    };

    loadStatsWithDelay();

    // Set up interval to refresh stats every minute
    const statsInterval = setInterval(() => {
      console.log("🔄 Refreshing analytics stats...");
      loadStats();
      loadBestRecords();
    }, 60000);

    // Set up separate interval to refresh weekly average every 5 minutes for real-time updates
    const frequentInterval = setInterval(() => {
      console.log("🕒 Refreshing weekly average...");
      const weeklyAvg = getWeeklyAveragePerDay();
      setWeeklyAverage(weeklyAvg);
    }, 300000); // 5 minutes = 300000ms

    return () => {
      clearInterval(statsInterval);
      clearInterval(frequentInterval);
    };
  }, []);

  const loadStats = () => {
    console.log("📊 Loading Pomodoro analytics stats...");

    // Use the comprehensive stats getter for better initialization
    const currentStats = getAllCurrentStats();
    const lifetimeStats = getLifetimeStats();

    console.log("📊 Loaded current stats:", currentStats);
    console.log("📊 Loaded lifetime stats:", lifetimeStats);

    setStats({
      today: currentStats.daily,
      week: currentStats.weekly,
      month: currentStats.monthly,
      lifetime: lifetimeStats,
    });

    // Load weekly average per day
    const weeklyAvg = getWeeklyAveragePerDay();
    console.log("📊 Loaded weekly average:", weeklyAvg);
    setWeeklyAverage(weeklyAvg);

    const prevDayStats = getPreviousDayStats();
    const prevWeekStats = getPreviousWeekStats();
    const prevMonthStats = getPreviousMonthStats();

    console.log("📊 Loaded previous stats:", {
      previousDay: prevDayStats,
      previousWeek: prevWeekStats,
      previousMonth: prevMonthStats,
    });

    setPreviousStats({
      previousDay: prevDayStats,
      previousWeek: prevWeekStats,
      previousMonth: prevMonthStats,
    });
  };

  const loadGoals = () => {
    const currentGoals = getPomodoroGoals();
    setGoals(currentGoals);
    setTempGoals(currentGoals);
  };

  const loadLabels = () => {
    const labels = getAvailableLabels();
    setAvailableLabels(labels);
  };

  const loadBestRecords = () => {
    const records = getBestRecords();
    setBestRecords(records);
  };

  const handleEditGoals = () => {
    setEditingGoals(true);
    setTempGoals(goals);
  };

  const handleSaveGoals = () => {
    const updatedGoals = updatePomodoroGoals(
      tempGoals.dailyMinutes,
      tempGoals.weeklyMinutes,
      tempGoals.monthlyMinutes
    );
    setGoals(updatedGoals.goals);
    setEditingGoals(false);
  };

  const handleCancelEdit = () => {
    setTempGoals(goals);
    setEditingGoals(false);
  };

  const handleAddTime = (hours, minutes, label, sessionCount = 1) => {
    addManualTime(hours, minutes, label, sessionCount);
    // Force immediate refresh after adding time
    setTimeout(() => {
      loadStats();
      loadBestRecords();
    }, 100);
  };

  const handleAddLabel = (newLabel) => {
    const updatedLabels = addLabel(newLabel);
    setAvailableLabels(updatedLabels);
  };

  const handleRemoveLabel = (labelToRemove) => {
    const updatedLabels = removeLabel(labelToRemove);
    setAvailableLabels(updatedLabels);
    return updatedLabels;
  };

  const getWeekDateRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysToSaturday = dayOfWeek === 6 ? 0 : (dayOfWeek + 1) % 7; // Days to go back to Saturday

    const saturday = new Date(today);
    saturday.setDate(today.getDate() - daysToSaturday);

    const friday = new Date(saturday);
    friday.setDate(saturday.getDate() + 6);

    const saturdayStr = saturday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const fridayStr = friday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return `${saturdayStr} - ${fridayStr}`;
  };

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  // Helper functions for formatting best record dates
  const formatBestDayDate = (record) => {
    if (!record.date) return "";
    const date = new Date(record.date);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatBestWeekDate = (record) => {
    if (!record.weekStart) return "";
    const startDate = new Date(record.weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const startStr = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${startStr} - ${endStr}`;
  };

  const formatBestMonthDate = (record) => {
    if (!record.month) return "";
    const [year, month] = record.month.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getLifetimeDays = () => {
    if (!stats.lifetime.startDate) return 0;
    const start = new Date(stats.lifetime.startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatRemainingTime = (minutes) => {
    if (minutes <= 0) return "0 min";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}min`;
    }
  };

  // Progress Goal Component for individual periods with Beautiful Design
  const ProgressGoalCard = ({
    type,
    currentMinutes,
    goalMinutes,
    editValue,
    onEditChange,
  }) => (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-lg border-2 border-white/50">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-sm text-gray-700 capitalize font-bold">
            {type} Target:
          </span>
          {editingGoals ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max={
                      type === "daily"
                        ? "24"
                        : type === "weekly"
                        ? "168"
                        : "720"
                    }
                    value={Math.floor(editValue / 60)}
                    onChange={(e) => {
                      const hours = parseInt(e.target.value) || 0;
                      const currentMinutes = editValue % 60;
                      onEditChange(hours * 60 + currentMinutes);
                    }}
                    className="w-16 px-2 py-2 text-sm border-2 border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 backdrop-blur-sm font-bold text-center"
                  />
                </div>
                <span className="text-lg text-gray-400 mt-5">:</span>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={editValue % 60}
                    onChange={(e) => {
                      const mins = parseInt(e.target.value) || 0;
                      const currentHours = Math.floor(editValue / 60);
                      onEditChange(currentHours * 60 + Math.min(59, mins));
                    }}
                    className="w-16 px-2 py-2 text-sm border-2 border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 backdrop-blur-sm font-bold text-center"
                  />
                </div>
              </div>
              <span className="text-xs text-gray-600 font-medium sm:ml-2">
                (Total: {formatDuration(editValue)})
              </span>
            </div>
          ) : (
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              {formatDuration(goalMinutes)}
            </span>
          )}
        </div>
        <span className="text-sm font-bold text-gray-800">
          {formatDuration(currentMinutes)} / {formatDuration(goalMinutes)}
        </span>
      </div>

      <ProgressBar
        percentage={Math.min((currentMinutes / goalMinutes) * 100, 100)}
      />

      <div className="flex justify-between text-xs text-gray-600 mt-3 font-medium">
        <span className="bg-white/60 px-3 py-1.5 rounded-xl">
          {Math.round((currentMinutes / goalMinutes) * 100)}% complete
        </span>
        <span className="bg-white/60 px-3 py-1.5 rounded-xl">
          {formatRemainingTime(Math.max(0, goalMinutes - currentMinutes))}{" "}
          remaining
        </span>
      </div>
    </div>
  );

  const StatCard = ({
    title,
    subtitle,
    value,
    sessions,
    labels = {},
    color,
    trend,
    previousValue,
    showGoal = false,
    goalMinutes = 0,
    goalType = "",
    editValue = 0,
    onEditChange = () => {},
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/60 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-white/50 ${color} relative overflow-hidden hover:shadow-2xl transition-all`}
    >
      {/* Decorative blur element */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color
          .replace("border-", "from-")
          .replace("-200", "-400/20")} ${color
          .replace("border-", "to-")
          .replace("-200", "-500/20")} rounded-full blur-2xl -z-10`}
      ></div>

      <div className="flex items-start justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div
            className={`p-3 sm:p-4 rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm border border-white/50`}
          >
            <Clock
              size={24}
              className={`sm:w-7 sm:h-7 ${color
                .replace("border-", "text-")
                .replace("-200", "-600")}`}
              strokeWidth={2.5}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                {title}
              </h3>
              {previousValue !== undefined && (
                <ProgressIndicator
                  current={value}
                  previous={previousValue}
                  className="flex-shrink-0"
                />
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 truncate font-medium">
              {subtitle}
            </p>
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-green-600 flex-shrink-0 ml-2 bg-green-50 px-3 py-1.5 rounded-xl">
            <TrendingUp size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-bold">{trend}</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
          <span className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            {formatDuration(value)}
          </span>
          {previousValue !== undefined && (
            <span className="text-xs sm:text-sm text-gray-600 font-medium">
              (prev: {formatDuration(previousValue)})
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 font-medium">
          <span className="bg-white/60 px-3 py-1.5 rounded-xl">
            {sessions} sessions
          </span>
          {value > 0 && (
            <span className="bg-white/60 px-3 py-1.5 rounded-xl">
              {formatRemainingTime(Math.round(value / sessions || 0))} avg
            </span>
          )}
        </div>

        {/* Progress Goal Section */}
        {showGoal && (
          <div className="mt-5 pt-5 border-t-2 border-white/30">
            <ProgressGoalCard
              type={goalType}
              currentMinutes={value}
              goalMinutes={goalMinutes}
              editValue={editValue}
              onEditChange={onEditChange}
            />
          </div>
        )}

        {/* Labels breakdown */}
        {Object.keys(labels).length > 0 && (
          <div
            className={`${
              showGoal ? "mt-4" : "mt-3 sm:mt-4"
            } pt-3 sm:pt-4 border-t-2 border-white/30`}
          >
            <p className="text-xs font-bold text-gray-700 mb-2 sm:mb-3">
              Breakdown:
            </p>
            <div className="space-y-2 max-h-28 sm:max-h-36 overflow-y-auto">
              {Object.entries(labels)
                .sort(([, a], [, b]) => b - a)
                .map(([label, minutes]) => (
                  <div
                    key={label}
                    className="flex justify-between text-xs bg-white/60 backdrop-blur-sm px-3 py-2 rounded-xl"
                  >
                    <span className="text-gray-700 capitalize truncate font-medium">
                      {label}:
                    </span>
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex-shrink-0 ml-2">
                      {formatDuration(minutes)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Beautiful Gradient Design */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl p-8 mb-6 shadow-xl border-2 border-white/50 relative overflow-hidden"
      >
        {/* Decorative blur elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl -z-10"></div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
                <Clock
                  size={32}
                  className="text-indigo-600"
                  strokeWidth={2.5}
                />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Analytics Dashboard
                </h2>
                <p className="text-gray-700 text-base sm:text-lg font-medium mt-1">
                  Comprehensive insights into your productivity journey
                </p>
              </div>
            </div>

            {/* Quick Stats with Beautiful Cards */}
            <div className="flex gap-3 flex-wrap">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg min-w-[85px] border border-white/50">
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  {formatDuration(stats.today.minutes)}
                </div>
                <div className="text-xs text-gray-700 font-medium mt-1">
                  Total Today
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg min-w-[85px] border border-white/50">
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  {formatDuration(weeklyAverage.averageMinutes)}
                </div>
                <div className="text-xs text-gray-700 font-medium mt-1">
                  Avg/Day This Week
                </div>
              </div>

              {/* Best Day Comparison Card */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg min-w-[85px] border border-white/50">
                {(() => {
                  const bestDayMinutes = bestRecords.bestDay?.minutes || 0;
                  const todayMinutes = stats.today.minutes;

                  // Calculate percentage difference
                  let percentageDiff = 0;
                  let isAhead = false;

                  if (bestDayMinutes > 0) {
                    if (todayMinutes >= bestDayMinutes) {
                      // Ahead or matching best day
                      percentageDiff = Math.round(
                        ((todayMinutes - bestDayMinutes) / bestDayMinutes) * 100
                      );
                      isAhead = true;
                    } else {
                      // Behind best day
                      percentageDiff = Math.round(
                        ((bestDayMinutes - todayMinutes) / bestDayMinutes) * 100
                      );
                      isAhead = false;
                    }
                  }

                  return (
                    <>
                      <div className="flex items-center justify-center gap-1">
                        {bestDayMinutes > 0 ? (
                          <>
                            {isAhead ? (
                              <TrendingUp
                                size={20}
                                className="text-green-600"
                              />
                            ) : (
                              <TrendingDown
                                size={20}
                                className="text-red-600"
                              />
                            )}
                            <div
                              className={`text-2xl font-bold ${
                                isAhead ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {percentageDiff}%
                            </div>
                          </>
                        ) : (
                          <div className="text-2xl font-bold text-gray-400">
                            --
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-700 font-medium mt-1">
                        vs Best Day
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg min-w-[85px] border border-white/50">
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  {stats.today.sessions}
                </div>
                <div className="text-xs text-gray-700 font-medium mt-1">
                  Sessions
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg min-w-[85px] border border-white/50">
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                  {Math.round((stats.today.minutes / goals.dailyMinutes) * 100)}
                  %
                </div>
                <div className="text-xs text-gray-700 font-medium mt-1">
                  Daily Goal
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg min-w-[85px] border border-white/50">
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                  {calculateGrade(
                    Math.round((stats.today.minutes / goals.dailyMinutes) * 100)
                  )}
                </div>
                <div className="text-xs text-gray-700 font-medium mt-1">
                  Grade
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons with Beautiful Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-2">
          {!editingGoals ? (
            <button
              onClick={handleEditGoals}
              className="flex items-center gap-2 px-4 py-2.5 text-sm bg-white/60 backdrop-blur-sm text-indigo-600 rounded-xl hover:bg-white/80 transition-all shadow-md hover:shadow-lg font-bold border border-white/50"
            >
              <Edit2 size={16} />
              Edit Goals
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveGoals}
                className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg font-bold"
              >
                <Check size={16} />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all shadow-md hover:shadow-lg font-bold"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          )}
          <button
            onClick={() => setShowAddTimeModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 font-bold text-sm"
          >
            <Plus size={20} />
            Add Time
          </button>
        </div>
      </div>

      {/* Enhanced Tabs with Beautiful Gradient Design */}
      <div className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl border-2 border-white/50 overflow-hidden shadow-xl relative">
        {/* Decorative blur element */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl -z-10"></div>

        <div className="flex border-b-2 border-white/30 overflow-x-auto bg-white/20 backdrop-blur-sm">
          {[
            {
              id: "today",
              label: "Today",
              icon: Clock,
              color: "from-blue-600 to-indigo-600",
            },
            {
              id: "week",
              label: "This Week",
              icon: TrendingUp,
              color: "from-green-600 to-emerald-600",
            },
            {
              id: "month",
              label: "This Month",
              icon: Target,
              color: "from-purple-600 to-pink-600",
            },
            {
              id: "lifetime",
              label: "Lifetime",
              icon: Clock,
              color: "from-orange-600 to-red-600",
            },
            {
              id: "insights",
              label: "Insights",
              icon: TrendingUp,
              color: "from-pink-600 to-rose-600",
            },
            {
              id: "advanced",
              label: "Analytics",
              icon: Target,
              color: "from-indigo-600 to-blue-600",
            },
            {
              id: "comparison",
              label: "Compare",
              icon: TrendingUp,
              color: "from-cyan-600 to-blue-600",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-bold border-b-4 transition-all duration-200 whitespace-nowrap relative ${
                activeTab === tab.id
                  ? `border-transparent bg-white/80 backdrop-blur-sm shadow-lg`
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-white/40"
              }`}
            >
              <tab.icon
                size={18}
                className={
                  activeTab === tab.id
                    ? `text-transparent bg-clip-text bg-gradient-to-r ${tab.color}`
                    : ""
                }
              />
              <span
                className={
                  activeTab === tab.id
                    ? `text-transparent bg-clip-text bg-gradient-to-r ${tab.color}`
                    : ""
                }
              >
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${tab.color} rounded-t-full`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-6 bg-white/40 backdrop-blur-sm">
          {/* Today Tab */}
          {activeTab === "today" && (
            <div className="space-y-6">
              {/* Today's Main Stats Section */}
              <div id="today-stats">
                <StatCard
                  title="Today"
                  subtitle={new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                  value={stats.today.minutes}
                  sessions={stats.today.sessions}
                  labels={stats.today.labels}
                  color="border-blue-200"
                  previousValue={previousStats.previousDay.minutes}
                  showGoal={true}
                  goalMinutes={goals.dailyMinutes}
                  goalType="daily"
                  editValue={tempGoals.dailyMinutes}
                  onEditChange={(value) =>
                    setTempGoals((prev) => ({ ...prev, dailyMinutes: value }))
                  }
                />

                {/* Best Day Record */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Target size={20} className="text-blue-600" />
                    Best Day Record
                  </h3>
                  <BestRecordCard
                    title="Your Best Day Ever"
                    record={bestRecords.bestDay}
                    color="border-blue-200"
                    formatDate={formatBestDayDate}
                  />
                </motion.div>

                {/* Average Study Time This Week */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock size={20} className="text-purple-600" />
                    Average Study Time This Week
                  </h3>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-baseline justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">
                        Daily Average
                      </h4>
                      <span className="text-xs text-gray-500">
                        Day {weeklyAverage.daysPassed} of 7
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-2">
                      {formatDuration(weeklyAverage.averageMinutes)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {formatDuration(weeklyAverage.totalMinutes)} total this
                      week • {weeklyAverage.totalSessions} sessions
                    </p>
                    {weeklyAverage.daysPassed > 0 && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                        <p className="text-xs text-gray-700 mb-1">
                          <strong>How it works:</strong> Total time divided by
                          days passed (including today)
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDuration(weeklyAverage.totalMinutes)} ÷{" "}
                          {weeklyAverage.daysPassed} days ={" "}
                          {formatDuration(weeklyAverage.averageMinutes)}/day
                        </p>
                      </div>
                    )}
                    {Object.keys(weeklyAverage.labels || {}).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2">
                          <strong>Weekly Breakdown:</strong>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(weeklyAverage.labels).map(
                            ([label, minutes]) => (
                              <span
                                key={label}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
                              >
                                {label}: {formatDuration(minutes)}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Previous Day Comparison */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    Previous Day Comparison
                  </h3>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Yesterday
                    </h4>
                    <div className="text-lg font-bold text-blue-600">
                      {formatDuration(previousStats.previousDay.minutes)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {previousStats.previousDay.sessions} sessions
                    </p>
                    {Object.keys(previousStats.previousDay.labels || {})
                      .length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <strong>Breakdown:</strong>{" "}
                        {Object.entries(previousStats.previousDay.labels)
                          .map(
                            ([label, minutes]) =>
                              `${label}: ${formatDuration(minutes)}`
                          )
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Enhanced Analytics Sections for Today Tab */}

              {/* Productivity Insights Section */}
              <motion.div
                id="insights-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={24} className="text-indigo-600" />
                  Smart Productivity Insights
                </h3>
                <ProductivityInsights
                  stats={{
                    today: stats.today,
                    week: stats.week,
                    month: stats.month,
                    previousDay: previousStats.previousDay,
                    previousWeek: previousStats.previousWeek,
                    previousMonth: previousStats.previousMonth,
                  }}
                  goals={goals}
                  bestRecords={bestRecords}
                />
              </motion.div>

              {/* Advanced Analytics Section */}
              <motion.div
                id="analytics-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Target size={24} className="text-green-600" />
                  Advanced Analytics Dashboard
                </h3>
                <AdvancedAnalytics stats={stats} goals={goals} />
              </motion.div>

              {/* Time Comparison Section */}
              <motion.div
                id="comparison-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={24} className="text-orange-600" />
                  Time Comparison Dashboard
                </h3>
                <TimeComparisonDashboard
                  stats={stats}
                  previousStats={previousStats}
                  goals={goals}
                  bestRecords={bestRecords}
                />
              </motion.div>

              {/* Personal Goals Section (Embedded in Today) */}
              <motion.div
                id="goals-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Target size={24} className="text-pink-600" />
                    Personal Goals Progress
                  </h3>
                  <button
                    onClick={() => setAddGoalModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-colors"
                  >
                    <Plus size={14} />
                    Add Goal
                  </button>
                </div>

                {userGoals.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg">
                    <Target size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-4">
                      No personal goals yet. Start by adding your first goal!
                    </p>
                    <button
                      onClick={() => setAddGoalModalOpen(true)}
                      className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      Add Your First Goal
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onUpdate={updateUserGoal}
                        onDelete={deleteUserGoal}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Week Tab */}
          {activeTab === "week" && (
            <div className="space-y-6">
              <StatCard
                title="This Week"
                subtitle={getWeekDateRange()}
                value={stats.week.minutes}
                sessions={stats.week.sessions}
                labels={stats.week.labels}
                color="border-green-200"
                previousValue={previousStats.previousWeek.minutes}
                showGoal={true}
                goalMinutes={goals.weeklyMinutes}
                goalType="weekly"
                editValue={tempGoals.weeklyMinutes}
                onEditChange={(value) =>
                  setTempGoals((prev) => ({ ...prev, weeklyMinutes: value }))
                }
              />

              {/* Best Week Record */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Target size={20} className="text-green-600" />
                  Best Week Record
                </h3>
                <BestRecordCard
                  title="Your Best Week Ever"
                  record={bestRecords.bestWeek}
                  color="border-green-200"
                  formatDate={formatBestWeekDate}
                />
              </motion.div>

              {/* Previous Week Comparison */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-600" />
                  Previous Week Comparison
                </h3>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Last Week
                  </h4>
                  <div className="text-lg font-bold text-green-600">
                    {formatDuration(previousStats.previousWeek.minutes)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {previousStats.previousWeek.sessions} sessions
                  </p>
                  {Object.keys(previousStats.previousWeek.labels || {}).length >
                    0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <strong>Breakdown:</strong>{" "}
                      {Object.entries(previousStats.previousWeek.labels)
                        .map(
                          ([label, minutes]) =>
                            `${label}: ${formatDuration(minutes)}`
                        )
                        .join(", ")}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Weekly Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Weekly Insights
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-green-50 rounded-lg p-3">
                    <div className="text-xl font-bold text-green-600">
                      {stats.week.sessions > 0
                        ? Math.round(stats.week.minutes / 7)
                        : 0}
                      min
                    </div>
                    <div className="text-sm text-gray-600">Daily Average</div>
                  </div>
                  <div className="text-center bg-green-50 rounded-lg p-3">
                    <div className="text-xl font-bold text-green-600">
                      {stats.week.sessions > 0
                        ? Math.round(stats.week.minutes / stats.week.sessions)
                        : 0}
                      min
                    </div>
                    <div className="text-sm text-gray-600">Avg Session</div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Month Tab */}
          {activeTab === "month" && (
            <div className="space-y-6">
              <StatCard
                title="This Month"
                subtitle={getCurrentMonthName()}
                value={stats.month.minutes}
                sessions={stats.month.sessions}
                labels={stats.month.labels}
                color="border-purple-200"
                previousValue={previousStats.previousMonth.minutes}
                showGoal={true}
                goalMinutes={goals.monthlyMinutes}
                goalType="monthly"
                editValue={tempGoals.monthlyMinutes}
                onEditChange={(value) =>
                  setTempGoals((prev) => ({ ...prev, monthlyMinutes: value }))
                }
              />

              {/* Best Month Record */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Target size={20} className="text-purple-600" />
                  Best Month Record
                </h3>
                <BestRecordCard
                  title="Your Best Month Ever"
                  record={bestRecords.bestMonth}
                  color="border-purple-200"
                  formatDate={formatBestMonthDate}
                />
              </motion.div>

              {/* Previous Month Comparison */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp size={20} className="text-purple-600" />
                  Previous Month Comparison
                </h3>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Last Month
                  </h4>
                  <div className="text-lg font-bold text-purple-600">
                    {formatDuration(previousStats.previousMonth.minutes)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {previousStats.previousMonth.sessions} sessions
                  </p>
                  {Object.keys(previousStats.previousMonth.labels || {})
                    .length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <strong>Breakdown:</strong>{" "}
                      {Object.entries(previousStats.previousMonth.labels)
                        .map(
                          ([label, minutes]) =>
                            `${label}: ${formatDuration(minutes)}`
                        )
                        .join(", ")}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Monthly Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Monthly Insights
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-purple-50 rounded-lg p-3">
                    <div className="text-xl font-bold text-purple-600">
                      {Math.round(stats.month.minutes / new Date().getDate())}
                      min
                    </div>
                    <div className="text-sm text-gray-600">Daily Average</div>
                  </div>
                  <div className="text-center bg-purple-50 rounded-lg p-3">
                    <div className="text-xl font-bold text-purple-600">
                      {Math.round((stats.month.minutes / 60) * 10) / 10}h
                    </div>
                    <div className="text-sm text-gray-600">Total Hours</div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Lifetime Tab */}
          {activeTab === "lifetime" && (
            <div className="space-y-6">
              <StatCard
                title="Lifetime"
                subtitle={`${getLifetimeDays()} days tracking`}
                value={stats.lifetime.totalMinutes}
                sessions={stats.lifetime.totalSessions}
                labels={stats.lifetime.labels}
                color="border-orange-200"
              />

              {/* Lifetime Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp size={20} className="text-orange-600" />
                  Lifetime Statistics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-lg font-bold text-orange-600">
                      {stats.lifetime.totalSessions > 0
                        ? Math.round(
                            stats.lifetime.totalMinutes /
                              stats.lifetime.totalSessions
                          )
                        : 0}
                      min
                    </div>
                    <div className="text-xs text-gray-600">Avg Session</div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-lg font-bold text-orange-600">
                      {Math.round((stats.lifetime.totalMinutes / 60) * 10) / 10}
                      h
                    </div>
                    <div className="text-xs text-gray-600">Total Hours</div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-lg font-bold text-orange-600">
                      {stats.lifetime.totalSessions}
                    </div>
                    <div className="text-xs text-gray-600">Total Sessions</div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-lg font-bold text-orange-600">
                      {getLifetimeDays()}
                    </div>
                    <div className="text-xs text-gray-600">Days Tracked</div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === "insights" && (
            <ProductivityInsights
              stats={{
                today: stats.today,
                week: stats.week,
                month: stats.month,
                previousDay: previousStats.previousDay,
                previousWeek: previousStats.previousWeek,
                previousMonth: previousStats.previousMonth,
              }}
              goals={goals}
              bestRecords={bestRecords}
            />
          )}

          {/* Advanced Analytics Tab */}
          {activeTab === "advanced" && (
            <AdvancedAnalytics stats={stats} goals={goals} />
          )}

          {/* Comparison Dashboard Tab */}
          {activeTab === "comparison" && (
            <TimeComparisonDashboard
              stats={stats}
              previousStats={previousStats}
              goals={goals}
              bestRecords={bestRecords}
            />
          )}
        </div>
      </div>

      {/* Add Time Modal */}
      <AddTimeModal
        isOpen={showAddTimeModal}
        onClose={() => setShowAddTimeModal(false)}
        onAddTime={handleAddTime}
        availableLabels={availableLabels}
        onAddLabel={handleAddLabel}
        onRemoveLabel={handleRemoveLabel}
      />

      {/* Add Goal Modal */}
      <AddGoalModal
        isOpen={addGoalModalOpen}
        onClose={() => setAddGoalModalOpen(false)}
        onAdd={addUserGoal}
      />
    </div>
  );
};
