import { motion } from "framer-motion";
import { Check, Clock, Edit2, Plus, TrendingUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  addLabel,
  addManualTime,
  cleanupOldStats,
  formatDuration,
  getAvailableLabels,
  getLifetimeStats,
  getPomodoroGoals,
  getPreviousDayStats,
  getPreviousMonthStats,
  getPreviousWeekStats,
  getThisMonthStats,
  getThisWeekStats,
  getTodayStats,
  removeLabel,
  updatePomodoroGoals,
} from "../../utils/pomodoroStats";
import { AddTimeModal } from "../timer/AddTimeModal";

export const PomodoroAnalytics = () => {
  const [stats, setStats] = useState({
    today: { minutes: 0, sessions: 0, labels: {} },
    week: { minutes: 0, sessions: 0, labels: {} },
    month: { minutes: 0, sessions: 0, labels: {} },
    lifetime: { totalMinutes: 0, totalSessions: 0, startDate: "", labels: {} },
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

  useEffect(() => {
    // Clean up old stats and load current stats
    cleanupOldStats();
    loadStats();
    loadGoals();
    loadLabels();

    // Set up interval to refresh stats every minute - temporarily disabled to debug reload issue
    // const interval = setInterval(loadStats, 60000);
    // return () => clearInterval(interval);
  }, []);

  const loadStats = () => {
    setStats({
      today: getTodayStats(),
      week: getThisWeekStats(),
      month: getThisMonthStats(),
      lifetime: getLifetimeStats(),
    });

    setPreviousStats({
      previousDay: getPreviousDayStats(),
      previousWeek: getPreviousWeekStats(),
      previousMonth: getPreviousMonthStats(),
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
    loadStats(); // Refresh stats after adding time
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
    const daysToSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

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

  const getLifetimeDays = () => {
    if (!stats.lifetime.startDate) return 0;
    const start = new Date(stats.lifetime.startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const StatCard = ({
    title,
    subtitle,
    value,
    sessions,
    labels = {},
    color,
    trend,
    previousValue,
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
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{subtitle}</p>
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

        {/* Labels breakdown */}
        {Object.keys(labels).length > 0 && (
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1 sm:mb-2">Breakdown:</p>
            <div className="space-y-1 max-h-16 sm:max-h-none overflow-y-auto">
              {Object.entries(labels)
                .sort(([, a], [, b]) => b - a)
                .slice(0, window.innerWidth < 640 ? 2 : 999) // Show only top 2 on mobile
                .map(([label, minutes]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-gray-600 capitalize truncate">{label}:</span>
                    <span className="font-medium text-gray-800 flex-shrink-0 ml-1">
                      {formatDuration(minutes)}
                    </span>
                  </div>
                ))}
              {Object.keys(labels).length > 2 && window.innerWidth < 640 && (
                <div className="text-xs text-gray-400 text-center">
                  +{Object.keys(labels).length - 2} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-xl">
            <Clock size={24} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Pomodoro Statistics
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Track your focus time and productivity
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddTimeModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm sm:text-base"
        >
          <Plus size={18} sm:size={20} />
          Add Time
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
        />

        <StatCard
          title="This Week"
          subtitle={getWeekDateRange()}
          value={stats.week.minutes}
          sessions={stats.week.sessions}
          labels={stats.week.labels}
          color="border-green-200"
          previousValue={previousStats.previousWeek.minutes}
        />

        <StatCard
          title="This Month"
          subtitle={getCurrentMonthName()}
          value={stats.month.minutes}
          sessions={stats.month.sessions}
          labels={stats.month.labels}
          color="border-purple-200"
          previousValue={previousStats.previousMonth.minutes}
        />

        <StatCard
          title="Lifetime"
          subtitle={`${getLifetimeDays()} days tracking`}
          value={stats.lifetime.totalMinutes}
          sessions={stats.lifetime.totalSessions}
          labels={stats.lifetime.labels}
          color="border-orange-200"
        />
      </div>

      {/* Quick Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-red-600" />
          Quick Insights & Previous Periods
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="text-center bg-white rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-red-600">
              {stats.lifetime.totalSessions > 0
                ? Math.round(
                    stats.lifetime.totalMinutes / stats.lifetime.totalSessions
                  )
                : 0}
              min
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Avg Session</div>
          </div>
          <div className="text-center bg-white rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-orange-600">
              {stats.week.sessions > 0 ? Math.round(stats.week.minutes / 7) : 0}
              min
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Daily Avg</div>
          </div>
          <div className="text-center bg-white rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">
              {stats.today.sessions}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Today's Sessions</div>
          </div>
          <div className="text-center bg-white rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {Math.round((stats.lifetime.totalMinutes / 60) * 10) / 10}h
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Total Hours</div>
          </div>
        </div>

        {/* Previous Periods Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-red-200">
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Previous Day</h4>
            <div className="text-base sm:text-lg font-bold text-blue-600">
              {formatDuration(previousStats.previousDay.minutes)}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              {previousStats.previousDay.sessions} sessions
            </p>
            {Object.keys(previousStats.previousDay.labels || {}).length > 0 && (
              <div className="mt-1 sm:mt-2 text-xs text-gray-500 truncate">
                {Object.entries(previousStats.previousDay.labels)
                  .slice(0, 2) // Show only top 2 on mobile
                  .map(
                    ([label, minutes]) => `${label}: ${formatDuration(minutes)}`
                  )
                  .join(", ")}
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Previous Week</h4>
            <div className="text-base sm:text-lg font-bold text-green-600">
              {formatDuration(previousStats.previousWeek.minutes)}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              {previousStats.previousWeek.sessions} sessions
            </p>
            {Object.keys(previousStats.previousWeek.labels || {}).length >
              0 && (
              <div className="mt-1 sm:mt-2 text-xs text-gray-500 truncate">
                {Object.entries(previousStats.previousWeek.labels)
                  .slice(0, 2) // Show only top 2 on mobile
                  .map(
                    ([label, minutes]) => `${label}: ${formatDuration(minutes)}`
                  )
                  .join(", ")}
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Previous Month</h4>
            <div className="text-base sm:text-lg font-bold text-purple-600">
              {formatDuration(previousStats.previousMonth.minutes)}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              {previousStats.previousMonth.sessions} sessions
            </p>
            {Object.keys(previousStats.previousMonth.labels || {}).length >
              0 && (
              <div className="mt-1 sm:mt-2 text-xs text-gray-500 truncate">
                {Object.entries(previousStats.previousMonth.labels)
                  .slice(0, 2) // Show only top 2 on mobile
                  .map(
                    ([label, minutes]) => `${label}: ${formatDuration(minutes)}`
                  )
                  .join(", ")}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Progress Bars with Editable Goals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Progress Goals
          </h3>
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
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Daily Goal */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-600">Daily Target:</span>
                {editingGoals ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="30"
                      max="1440"
                      value={Math.round(tempGoals.dailyMinutes)}
                      onChange={(e) =>
                        setTempGoals((prev) => ({
                          ...prev,
                          dailyMinutes: parseInt(e.target.value) || 30,
                        }))
                      }
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs sm:text-sm text-gray-600">
                      minutes ({formatDuration(tempGoals.dailyMinutes)})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-medium text-gray-800">
                    {formatDuration(goals.dailyMinutes)}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-800">
                {formatDuration(stats.today.minutes)} /{" "}
                {formatDuration(goals.dailyMinutes)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
              <div
                className="bg-blue-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (stats.today.minutes / goals.dailyMinutes) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                {Math.round((stats.today.minutes / goals.dailyMinutes) * 100)}%
                complete
              </span>
              <span>
                {Math.max(0, goals.dailyMinutes - stats.today.minutes)} min
                remaining
              </span>
            </div>
          </div>

          {/* Weekly Goal */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-600">Weekly Target:</span>
                {editingGoals ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="180"
                      max="10080"
                      value={Math.round(tempGoals.weeklyMinutes)}
                      onChange={(e) =>
                        setTempGoals((prev) => ({
                          ...prev,
                          weeklyMinutes: parseInt(e.target.value) || 180,
                        }))
                      }
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs sm:text-sm text-gray-600">
                      minutes ({formatDuration(tempGoals.weeklyMinutes)})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-medium text-gray-800">
                    {formatDuration(goals.weeklyMinutes)}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-800">
                {formatDuration(stats.week.minutes)} /{" "}
                {formatDuration(goals.weeklyMinutes)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
              <div
                className="bg-green-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (stats.week.minutes / goals.weeklyMinutes) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                {Math.round((stats.week.minutes / goals.weeklyMinutes) * 100)}%
                complete
              </span>
              <span>
                {Math.max(0, goals.weeklyMinutes - stats.week.minutes)} min
                remaining
              </span>
            </div>
          </div>

          {/* Monthly Goal */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-600">Monthly Target:</span>
                {editingGoals ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="720"
                      max="43200"
                      value={Math.round(tempGoals.monthlyMinutes)}
                      onChange={(e) =>
                        setTempGoals((prev) => ({
                          ...prev,
                          monthlyMinutes: parseInt(e.target.value) || 720,
                        }))
                      }
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs sm:text-sm text-gray-600">
                      minutes ({formatDuration(tempGoals.monthlyMinutes)})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-medium text-gray-800">
                    {formatDuration(goals.monthlyMinutes)}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-800">
                {formatDuration(stats.month.minutes)} /{" "}
                {formatDuration(goals.monthlyMinutes)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
              <div
                className="bg-purple-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (stats.month.minutes / goals.monthlyMinutes) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                {Math.round((stats.month.minutes / goals.monthlyMinutes) * 100)}
                % complete
              </span>
              <span>
                {Math.max(0, goals.monthlyMinutes - stats.month.minutes)} min
                remaining
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add Time Modal */}
      <AddTimeModal
        isOpen={showAddTimeModal}
        onClose={() => setShowAddTimeModal(false)}
        onAddTime={handleAddTime}
        availableLabels={availableLabels}
        onAddLabel={handleAddLabel}
        onRemoveLabel={handleRemoveLabel}
      />
    </div>
  );
};
