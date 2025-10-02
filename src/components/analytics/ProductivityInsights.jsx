import { motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  BarChart3,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const ProductivityInsights = ({ stats, goals, bestRecords }) => {
  const [insights, setInsights] = useState([]);
  const [streaks, setStreaks] = useState({
    current: 0,
    longest: 0,
    today: false,
  });

  const generateInsights = useCallback(() => {
    const newInsights = [];

    // Productivity trends
    const todayVsYesterday =
      ((stats.today.minutes - (stats.previousDay?.minutes || 0)) /
        Math.max(stats.previousDay?.minutes || 1, 1)) *
      100;

    if (todayVsYesterday > 20) {
      newInsights.push({
        type: "positive",
        icon: TrendingUp,
        title: "Great momentum!",
        message: `You're ${Math.round(
          todayVsYesterday
        )}% more productive than yesterday`,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      });
    } else if (todayVsYesterday < -20) {
      newInsights.push({
        type: "warning",
        icon: TrendingDown,
        title: "Productivity dip",
        message: `Consider taking a break or adjusting your goals`,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      });
    }

    // Goal achievement insights
    const dailyProgress = (stats.today.minutes / goals.dailyMinutes) * 100;
    if (dailyProgress >= 100) {
      newInsights.push({
        type: "achievement",
        icon: Award,
        title: "Daily goal achieved!",
        message: `You've completed your daily target. Consider stretching it?`,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
      });
    } else if (dailyProgress >= 80) {
      newInsights.push({
        type: "positive",
        icon: Target,
        title: "Almost there!",
        message: `Only ${Math.round(
          goals.dailyMinutes - stats.today.minutes
        )} minutes to reach your daily goal`,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      });
    }

    // Best time analysis
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 11) {
      newInsights.push({
        type: "tip",
        icon: Zap,
        title: "Peak focus time",
        message:
          "Most people are most productive between 9-11 AM. Perfect time for deep work!",
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
      });
    }

    // Weekly pattern insights
    const weeklyAvg = stats.week.minutes / 7;
    if (stats.today.minutes > weeklyAvg * 1.5) {
      newInsights.push({
        type: "positive",
        icon: BarChart3,
        title: "Above weekly average",
        message: `Today's focus time is ${Math.round(
          (stats.today.minutes / weeklyAvg - 1) * 100
        )}% above your weekly average`,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      });
    }

    setInsights(newInsights.slice(0, 3)); // Show max 3 insights
  }, [stats, goals]);

  const calculateStreaks = useCallback(() => {
    // This would typically require historical daily data
    // For now, we'll simulate based on current data
    const hasMetGoalToday = stats.today.minutes >= goals.dailyMinutes;

    setStreaks({
      current: hasMetGoalToday ? 1 : 0,
      longest: Math.max(hasMetGoalToday ? 1 : 0, 5), // Simulated
      today: hasMetGoalToday,
    });
  }, [stats.today.minutes, goals.dailyMinutes]);

  useEffect(() => {
    generateInsights();
    calculateStreaks();
  }, [generateInsights, calculateStreaks]);

  const getInsightIcon = (IconComponent) => IconComponent;

  return (
    <div className="space-y-6">
      {/* Productivity Streaks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap size={24} />
          Productivity Streak
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{streaks.current}</div>
            <div className="text-sm opacity-90">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{streaks.longest}</div>
            <div className="text-sm opacity-90">Longest Streak</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl mb-1 ${streaks.today ? "🔥" : "⭐"}`}>
              {streaks.today ? "🔥" : "⭐"}
            </div>
            <div className="text-sm opacity-90">
              {streaks.today ? "Goal Met!" : "Keep Going!"}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <AlertCircle size={20} className="text-blue-600" />
            Smart Insights
          </h3>

          {insights.map((insight, index) => {
            const IconComponent = getInsightIcon(insight.icon);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${insight.bgColor} ${insight.borderColor} border rounded-lg p-4`}
              >
                <div className="flex items-start gap-3">
                  <IconComponent size={20} className={insight.color} />
                  <div>
                    <h4 className={`font-semibold ${insight.color} mb-1`}>
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-700">{insight.message}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default ProductivityInsights;
