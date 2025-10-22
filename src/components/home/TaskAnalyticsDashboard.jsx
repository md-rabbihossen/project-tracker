import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getDateString } from "../../utils/helpers";
import { getTodayStats } from "../../utils/pomodoroStats";

const TaskAnalyticsDashboard = ({
  tasks,
  completedOneTimeTasks = [],
  skippedTasks = [],
}) => {
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

      // Get skipped task IDs for today
      const todayDateString = getDateString();
      const skippedTaskIdsToday = new Set(
        skippedTasks
          .filter((st) => st.skipDate === todayDateString)
          .map((st) => st.taskId)
      );

      // Today's stats - exclude skipped tasks
      const todayTasks = tasks.filter(
        (task) => shouldShowTaskToday(task) && !skippedTaskIdsToday.has(task.id)
      );
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

      // Calculate priority bonus including one-time tasks
      const priorityTasksCompleted = todayTasks.filter(
        (task) => task.priority === "high" && task.completed
      ).length;
      const oneTimeHighPriorityCompleted = completedOneTimeTasks.filter(
        (task) => task.priority === "high"
      ).length;

      const totalPriorityTasks = todayTasks.filter(
        (task) => task.priority === "high"
      ).length;
      const totalOneTimeHighPriority = completedOneTimeTasks.filter(
        (task) => task.priority === "high"
      ).length;

      const totalPriorityTasksCount =
        totalPriorityTasks + totalOneTimeHighPriority;
      const totalCompletedPriorityTasks =
        priorityTasksCompleted + oneTimeHighPriorityCompleted;

      const priorityBonus =
        totalPriorityTasksCount > 0
          ? (totalCompletedPriorityTasks / totalPriorityTasksCount) * 20
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
  }, [tasks, completedOneTimeTasks, skippedTasks]);

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
        className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-white/50 relative overflow-hidden"
      >
        {/* Decorative blur elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl -z-10"></div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-3">
            <div className="p-3 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
              <Zap size={28} className="text-indigo-600" />
            </div>
            Productivity Score
          </h3>
          <div
            className={`px-5 py-2.5 rounded-2xl text-base font-bold shadow-lg ${getScoreColor()}`}
          >
            {getScoreLabel()}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg
              className="w-24 h-24 transform -rotate-90"
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
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                {score}
              </span>
            </div>
          </div>

          <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-md border border-white/50">
            <div className="text-sm text-gray-700 space-y-2 font-medium">
              <div className="flex justify-between">
                <span>Task Completion:</span>
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
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
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  {(() => {
                    // Get skipped task IDs for today
                    const todayDateString = getDateString();
                    const skippedTaskIdsToday = new Set(
                      skippedTasks
                        .filter((st) => st.skipDate === todayDateString)
                        .map((st) => st.taskId)
                    );

                    // Filter out skipped tasks from high priority calculation
                    const recurringHighPriority = tasks.filter(
                      (t) => 
                        t.priority === "high" && 
                        shouldShowTaskToday(t) &&
                        !skippedTaskIdsToday.has(t.id)
                    );
                    const completedRecurringHighPriority = tasks.filter(
                      (t) =>
                        t.priority === "high" &&
                        t.completed &&
                        shouldShowTaskToday(t) &&
                        !skippedTaskIdsToday.has(t.id)
                    );
                    const oneTimeHighPriority = completedOneTimeTasks.filter(
                      (t) => t.priority === "high"
                    );

                    const totalHighPriority =
                      recurringHighPriority.length + oneTimeHighPriority.length;
                    const completedHighPriority =
                      completedRecurringHighPriority.length +
                      oneTimeHighPriority.length;

                    return totalHighPriority > 0
                      ? Math.round(
                          (completedHighPriority / totalHighPriority) * 100
                        )
                      : 100;
                  })()}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span>Consistency:</span>
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
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
