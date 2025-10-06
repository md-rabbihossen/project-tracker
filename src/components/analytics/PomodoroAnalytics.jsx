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
  getLast6HoursStats,
  getLifetimeStats,
  getPomodoroGoals,
  getPreviousDayStats,
  getPreviousMonthStats,
  getPreviousWeekStats,
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

// Best Record Card Component
const BestRecordCard = ({ title, record, color, formatDate }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-xl p-4 shadow-sm border ${color} relative overflow-hidden`}
  >
    <div className="absolute top-2 right-2">
      <div className="text-2xl">🏆</div>
    </div>
    <h4 className="font-semibold text-gray-800 mb-2 text-sm">{title}</h4>
    {record.minutes > 0 ? (
      <>
        <div
          className={`text-2xl font-bold mb-1 ${color
            .replace("border-", "text-")
            .replace("-200", "-600")}`}
        >
          {formatDuration(record.minutes)}
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p>{record.sessions} sessions</p>
          <p className="text-xs text-gray-500">{formatDate(record)}</p>
        </div>
      </>
    ) : (
      <div className="text-gray-400 text-sm py-2">No record yet</div>
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

  const [last6HoursStats, setLast6HoursStats] = useState({
    minutes: 0,
    sessions: 0,
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

    // Set up separate interval to refresh last 6 hours stats every 5 minutes for real-time updates
    const frequentInterval = setInterval(() => {
      console.log("🕒 Refreshing last 6 hours stats...");
      const last6Hours = getLast6HoursStats();
      setLast6HoursStats(last6Hours);
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

    // Load last 6 hours stats - this will now use real timestamped data
    const last6Hours = getLast6HoursStats();
    console.log("📊 Loaded last 6 hours stats:", last6Hours);
    setLast6HoursStats(last6Hours);

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

  const handleAddTime = (hours, minutes, label) => {
    addManualTime(hours, minutes, label);
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

  // Progress Goal Component for individual periods
  const ProgressGoalCard = ({
    type,
    currentMinutes,
    goalMinutes,
    editValue,
    onEditChange,
  }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span className="text-sm text-gray-600 capitalize">
            {type} Target:
          </span>
          {editingGoals ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={
                  type === "daily" ? "30" : type === "weekly" ? "180" : "720"
                }
                max={
                  type === "daily"
                    ? "1440"
                    : type === "weekly"
                    ? "10080"
                    : "43200"
                }
                value={Math.round(editValue)}
                onChange={(e) =>
                  onEditChange(
                    parseInt(e.target.value) ||
                      (type === "daily" ? 30 : type === "weekly" ? 180 : 720)
                  )
                }
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600">
                minutes ({formatDuration(editValue)})
              </span>
            </div>
          ) : (
            <span className="text-sm font-medium text-gray-800">
              {formatDuration(goalMinutes)}
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-gray-800">
          {formatDuration(currentMinutes)} / {formatDuration(goalMinutes)}
        </span>
      </div>

      <ProgressBar
        percentage={Math.min((currentMinutes / goalMinutes) * 100, 100)}
      />

      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>
          {Math.round((currentMinutes / goalMinutes) * 100)}% complete
        </span>
        <span>
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
      className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 ${color}`}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div
            className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${color
              .replace("border-", "bg-")
              .replace("-200", "-100")}`}
          >
            <Clock
              size={20}
              className={`sm:w-6 sm:h-6 ${color
                .replace("border-", "text-")
                .replace("-200", "-600")}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
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
            <p className="text-xs sm:text-sm text-gray-600 truncate">
              {subtitle}
            </p>
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-green-600 flex-shrink-0 ml-2">
            <TrendingUp size={14} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">{trend}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-gray-800">
            {formatDuration(value)}
          </span>
          {previousValue !== undefined && (
            <span className="text-xs sm:text-sm text-gray-500">
              (prev: {formatDuration(previousValue)})
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <span>{sessions} sessions</span>
          {value > 0 && <span>{Math.round(value / sessions || 0)}min avg</span>}
        </div>

        {/* Progress Goal Section */}
        {showGoal && (
          <div className="mt-4 pt-4 border-t border-gray-100">
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
              showGoal ? "mt-3" : "mt-2 sm:mt-3"
            } pt-2 sm:pt-3 border-t border-gray-100`}
          >
            <p className="text-xs font-medium text-gray-500 mb-1 sm:mb-2">
              Breakdown:
            </p>
            <div className="space-y-1 max-h-24 sm:max-h-32 overflow-y-auto">
              {Object.entries(labels)
                .sort(([, a], [, b]) => b - a)
                .map(([label, minutes]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-gray-600 capitalize truncate">
                      {label}:
                    </span>
                    <span className="font-medium text-gray-800 flex-shrink-0 ml-1">
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
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 mb-6 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Clock size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">
                  Analytics Dashboard
                </h2>
                <p className="text-white/90 text-sm sm:text-base">
                  Comprehensive insights into your productivity journey
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 text-center">
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm min-w-[70px]">
                <div className="text-xl font-bold">
                  {formatDuration(stats.today.minutes)}
                </div>
                <div className="text-xs text-white/80">Total Today</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm min-w-[70px]">
                <div className="text-xl font-bold">
                  {formatDuration(last6HoursStats.minutes)}
                </div>
                <div className="text-xs text-white/80">Last 6 Hours</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm min-w-[70px]">
                <div className="text-xl font-bold">{stats.today.sessions}</div>
                <div className="text-xs text-white/80">Sessions</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm min-w-[70px]">
                <div className="text-xl font-bold">
                  {Math.round((stats.today.minutes / goals.dailyMinutes) * 100)}
                  %
                </div>
                <div className="text-xs text-white/80">Daily Goal</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm min-w-[70px]">
                <div className="text-xl font-bold">
                  {calculateGrade(
                    Math.round((stats.today.minutes / goals.dailyMinutes) * 100)
                  )}
                </div>
                <div className="text-xs text-white/80">Grade</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-2">
          {!editingGoals ? (
            <button
              onClick={handleEditGoals}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              <Edit2 size={14} />
              Edit Goals
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveGoals}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Check size={14} />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          )}
          <button
            onClick={() => setShowAddTimeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            Add Time
          </button>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
        <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50/50">
          {[
            {
              id: "today",
              label: "Today",
              icon: Clock,
              color: "text-blue-600",
            },
            {
              id: "week",
              label: "This Week",
              icon: TrendingUp,
              color: "text-green-600",
            },
            {
              id: "month",
              label: "This Month",
              icon: Target,
              color: "text-purple-600",
            },
            {
              id: "lifetime",
              label: "Lifetime",
              icon: Clock,
              color: "text-orange-600",
            },
            {
              id: "insights",
              label: "Insights",
              icon: TrendingUp,
              color: "text-pink-600",
            },
            {
              id: "advanced",
              label: "Analytics",
              icon: Target,
              color: "text-indigo-600",
            },
            {
              id: "comparison",
              label: "Compare",
              icon: TrendingUp,
              color: "text-cyan-600",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap relative ${
                activeTab === tab.id
                  ? `border-indigo-500 ${tab.color} bg-white shadow-sm`
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-t-lg border-b-2 border-indigo-500 -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
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
