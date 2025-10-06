import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getTodayStats } from "../../utils/pomodoroStats";

const TaskAnalyticsDashboard = ({ tasks, completedOneTimeTasks = [] }) => {
  const [analytics, setAnalytics] = useState({
    todayStats: { completed: 0, pending: 0, total: 0 },
    weekStats: { completed: 0, pending: 0, total: 0 },
    productivity: { score: 0, trend: "stable" },
    streaks: { current: 0, longest: 0 },
    timeSpent: { today: 0, week: 0 },
  });

  useEffect(() => {
    const calculateAnalytics = () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      // Get actual pomodoro time data from analytics
      const pomodoroStats = getTodayStats();
      const todayActualMinutes = pomodoroStats.minutes || 0;

      // Today's stats
      const todayTasks = tasks.filter((task) => shouldShowTaskToday(task));
      const todayCompleted = todayTasks.filter((task) => task.completed).length;
      const todayPending = todayTasks.length - todayCompleted;
      const todayTotal = todayTasks.length + completedOneTimeTasks.length;

      // Week's stats (simplified - would need historical data)
      const weekCompleted = todayCompleted + completedOneTimeTasks.length;
      const weekPending = todayPending;
      const weekTotal = todayTotal;

      // Productivity score (0-100)
      const completionRate =
        todayTotal > 0 ? (weekCompleted / todayTotal) * 100 : 0;
      const priorityTasksCompleted = todayTasks.filter(
        (task) => task.priority === "high" && task.completed
      ).length;
      const totalPriorityTasks = todayTasks.filter(
        (task) => task.priority === "high"
      ).length;

      const priorityBonus =
        totalPriorityTasks > 0
          ? (priorityTasksCompleted / totalPriorityTasks) * 20
          : 0;

      const productivityScore = Math.min(
        100,
        Math.round(completionRate + priorityBonus)
      );

      setAnalytics({
        todayStats: {
          completed: todayCompleted + completedOneTimeTasks.length,
          pending: todayPending,
          total: todayTotal,
        },
        weekStats: {
          completed: weekCompleted,
          pending: weekPending,
          total: weekTotal,
        },
        productivity: {
          score: productivityScore,
          trend:
            productivityScore > 70
              ? "up"
              : productivityScore > 40
              ? "stable"
              : "down",
        },
        streaks: {
          current: completedOneTimeTasks.length > 0 ? 1 : 0,
          longest: Math.max(completedOneTimeTasks.length, 3),
        },
        timeSpent: { today: todayActualMinutes, week: weekCompleted * 15 }, // Use actual pomodoro time for today
      });
    };

    calculateAnalytics();
  }, [tasks, completedOneTimeTasks]);

  const shouldShowTaskToday = (task) => {
    const today = new Date();
    const todayDateString = today.toISOString().split("T")[0];

    if (task.repeatType === "daily") return true;
    if (task.repeatType === "weekly") {
      const dayOfWeek = today.getDay();
      return task.selectedDays?.includes(dayOfWeek);
    }
    if (task.repeatType === "custom") {
      const dayOfWeek = today.getDay();
      return task.selectedDays?.includes(dayOfWeek);
    }
    return task.date === todayDateString || !task.date;
  };

  const ProductivityMeter = ({ score }) => {
    const getScoreColor = () => {
      if (score >= 80) return "text-green-600 bg-green-100";
      if (score >= 60) return "text-yellow-600 bg-yellow-100";
      if (score >= 40) return "text-orange-600 bg-orange-100";
      return "text-red-600 bg-red-100";
    };

    const getScoreLabel = () => {
      if (score >= 80) return "Excellent";
      if (score >= 60) return "Good";
      if (score >= 40) return "Fair";
      return "Needs Focus";
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Zap size={20} className="text-indigo-600" />
            Productivity Score
          </h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor()}`}
          >
            {getScoreLabel()}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg
              className="w-20 h-20 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                className={
                  score >= 80
                    ? "text-green-500"
                    : score >= 60
                    ? "text-yellow-500"
                    : score >= 40
                    ? "text-orange-500"
                    : "text-red-500"
                }
                style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-800">{score}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Task Completion:</span>
                <span className="font-medium">
                  {analytics.todayStats.total > 0
                    ? Math.round(
                        (analytics.todayStats.completed /
                          analytics.todayStats.total) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span>Priority Focus:</span>
                <span className="font-medium">
                  {tasks.filter(
                    (t) => t.priority === "high" && shouldShowTaskToday(t)
                  ).length > 0
                    ? Math.round(
                        (tasks.filter(
                          (t) =>
                            t.priority === "high" &&
                            t.completed &&
                            shouldShowTaskToday(t)
                        ).length /
                          tasks.filter(
                            (t) =>
                              t.priority === "high" && shouldShowTaskToday(t)
                          ).length) *
                          100
                      )
                    : 100}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span>Consistency:</span>
                <span className="font-medium">
                  {analytics.streaks.current > 0 ? "Active" : "Start today"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Productivity Score */}
      <ProductivityMeter score={analytics.productivity.score} />
    </div>
  );
};

export default TaskAnalyticsDashboard;
