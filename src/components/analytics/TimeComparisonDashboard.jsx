import { motion } from "framer-motion";
import {
  Award,
  BarChart3,
  Clock,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

const TimeComparisonDashboard = ({
  stats,
  previousStats,
  goals,
  bestRecords,
}) => {
  // Calculate comparisons
  const calculateComparison = (current, previous) => {
    if (previous === 0 && current === 0)
      return { percentage: 0, trend: "neutral" };
    if (previous === 0) return { percentage: 100, trend: "up" };

    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(Math.round(change)),
      trend: change >= 0 ? "up" : "down",
    };
  };

  const todayComparison = calculateComparison(
    stats.today.minutes,
    previousStats.previousDay.minutes
  );
  const weekComparison = calculateComparison(
    stats.week.minutes,
    previousStats.previousWeek.minutes
  );
  const monthComparison = calculateComparison(
    stats.month.minutes,
    previousStats.previousMonth.minutes
  );

  const ComparisonCard = ({
    title,
    current,
    previous,
    goal,
    comparison,
    color,
    record,
  }) => {
    const progressToGoal = goal ? (current / goal) * 100 : 0;
    const isRecordDay = record && current >= record.minutes;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-xl p-6 shadow-sm border ${color} relative overflow-hidden`}
      >
        {/* Record indicator */}
        {isRecordDay && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
              <Award size={12} />
              New Record!
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <div className="flex items-center gap-2">
              {comparison.trend === "up" ? (
                <TrendingUp size={16} className="text-green-600" />
              ) : comparison.trend === "down" ? (
                <TrendingDown size={16} className="text-red-600" />
              ) : null}
              <span
                className={`text-sm font-medium ${
                  comparison.trend === "up"
                    ? "text-green-600"
                    : comparison.trend === "down"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {comparison.percentage > 0
                  ? `${comparison.percentage}%`
                  : "No change"}
              </span>
            </div>
          </div>

          {/* Current vs Previous */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-1">
                {Math.round((current / 60) * 10) / 10}h
              </div>
              <div className="text-xs text-gray-600">Current</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-gray-600 mb-1">
                {Math.round((previous / 60) * 10) / 10}h
              </div>
              <div className="text-xs text-gray-600">Previous</div>
            </div>
          </div>

          {/* Goal Progress */}
          {goal && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Goal Progress</span>
                <span className="font-medium">
                  {Math.round(progressToGoal)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    progressToGoal >= 100
                      ? "bg-green-500"
                      : progressToGoal >= 80
                      ? "bg-blue-500"
                      : progressToGoal >= 50
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                  style={{ width: `${Math.min(progressToGoal, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {Math.round(Math.max(0, goal - current))} minutes remaining
              </div>
            </div>
          )}

          {/* Best Record Comparison */}
          {record && record.minutes > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Best Record:</span>
                <span className="font-medium text-gray-800">
                  {Math.round((record.minutes / 60) * 10) / 10}h
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {current >= record.minutes ? (
                  <span className="text-green-600 font-medium">
                    🎉 New record achieved!
                  </span>
                ) : (
                  `${Math.round(
                    record.minutes - current
                  )} minutes to beat record`
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const StreakCard = () => {
    // Calculate streaks (simplified - in real app, you'd track daily data)
    const hasMetDailyGoal = stats.today.minutes >= goals.dailyMinutes;
    const currentStreak = hasMetDailyGoal ? 1 : 0; // Would be calculated from historical data

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Goal Achievement Streak</h3>
          <Zap size={24} className="text-yellow-300" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold mb-1">{currentStreak}</div>
            <div className="text-sm opacity-90">Current</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">7</div>
            <div className="text-sm opacity-90">Longest</div>
          </div>
          <div>
            <div className="text-2xl mb-1">{hasMetDailyGoal ? "🔥" : "⭐"}</div>
            <div className="text-sm opacity-90">
              {hasMetDailyGoal ? "On Fire!" : "Keep Going!"}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white/20 rounded-lg">
          <div className="text-sm">
            <strong>This Week:</strong> Met daily goal{" "}
            {Math.min(currentStreak, 7)} out of 7 days
          </div>
        </div>
      </motion.div>
    );
  };

  const QuickInsights = () => {
    const insights = [];

    // Generate insights based on data
    if (todayComparison.trend === "up" && todayComparison.percentage > 20) {
      insights.push({
        type: "positive",
        text: `🚀 Great progress! You're ${todayComparison.percentage}% more productive than yesterday.`,
      });
    }

    if (stats.today.minutes >= goals.dailyMinutes) {
      insights.push({
        type: "achievement",
        text: `🎯 Daily goal achieved! You've completed ${Math.round(
          (stats.today.minutes / goals.dailyMinutes) * 100
        )}% of your target.`,
      });
    }

    const avgSessionLength =
      stats.today.sessions > 0 ? stats.today.minutes / stats.today.sessions : 0;
    if (avgSessionLength >= 25 && avgSessionLength <= 45) {
      insights.push({
        type: "positive",
        text: `⏰ Perfect session length! Your average session of ${Math.round(
          avgSessionLength
        )} minutes is in the optimal range.`,
      });
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600" />
          Quick Insights
        </h3>

        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-sm ${
                  insight.type === "positive"
                    ? "bg-green-50 text-green-800"
                    : insight.type === "achievement"
                    ? "bg-blue-50 text-blue-800"
                    : "bg-gray-50 text-gray-800"
                }`}
              >
                {insight.text}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            <p>Start working to see insights appear here!</p>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Streak Card */}
      <StreakCard />

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <ComparisonCard
          title="Today vs Yesterday"
          current={stats.today.minutes}
          previous={previousStats.previousDay.minutes}
          goal={goals.dailyMinutes}
          comparison={todayComparison}
          color="border-blue-200"
          record={bestRecords.bestDay}
        />

        <ComparisonCard
          title="This Week vs Last Week"
          current={stats.week.minutes}
          previous={previousStats.previousWeek.minutes}
          goal={goals.weeklyMinutes}
          comparison={weekComparison}
          color="border-green-200"
          record={bestRecords.bestWeek}
        />

        <ComparisonCard
          title="This Month vs Last Month"
          current={stats.month.minutes}
          previous={previousStats.previousMonth.minutes}
          goal={goals.monthlyMinutes}
          comparison={monthComparison}
          color="border-purple-200"
          record={bestRecords.bestMonth}
        />
      </div>

      {/* Quick Insights */}
      <QuickInsights />

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target size={20} className="text-orange-600" />
          Performance Summary
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {Math.round((stats.lifetime.totalMinutes / 60) * 10) / 10}
            </div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </div>

          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {stats.lifetime.totalSessions}
            </div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </div>

          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {stats.lifetime.totalSessions > 0
                ? Math.round(
                    stats.lifetime.totalMinutes / stats.lifetime.totalSessions
                  )
                : 0}
            </div>
            <div className="text-sm text-gray-600">Avg Session</div>
          </div>

          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {Math.max(
                bestRecords.bestDay.minutes,
                bestRecords.bestWeek.minutes / 7,
                bestRecords.bestMonth.minutes / 30
              ) > 0
                ? Math.round(
                    Math.max(
                      bestRecords.bestDay.minutes,
                      bestRecords.bestWeek.minutes / 7,
                      bestRecords.bestMonth.minutes / 30
                    )
                  )
                : 0}
            </div>
            <div className="text-sm text-gray-600">Best Day</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TimeComparisonDashboard;
