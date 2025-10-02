import { motion } from "framer-motion";
import { Award, Calendar, Clock, Target, TrendingUp, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AdvancedAnalytics = ({ stats, goals }) => {
  // Prepare data for charts
  const prepareCategoryData = () => {
    const labels = stats.today.labels || {};
    return Object.entries(labels).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage:
        stats.today.minutes > 0
          ? ((value / stats.today.minutes) * 100).toFixed(1)
          : 0,
    }));
  };

  const prepareWeeklyTrend = () => {
    // Simulate weekly data - in real app, you'd have historical data
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

      // Simulate data based on current stats with some variation
      const baseMinutes = Math.max(
        0,
        stats.today.minutes + (Math.random() - 0.5) * 60
      );
      weekData.push({
        day: dayName,
        minutes: i === 0 ? stats.today.minutes : Math.round(baseMinutes),
        date: date.toLocaleDateString(),
      });
    }

    return weekData;
  };

  const prepareHourlyData = () => {
    // Simulate hourly productivity pattern
    const hours = [];
    const currentHour = new Date().getHours();

    for (let i = 0; i < 24; i++) {
      let productivity = 0;

      // Simulate realistic productivity pattern
      if (i >= 8 && i <= 11)
        productivity = 80 + Math.random() * 20; // Morning peak
      else if (i >= 14 && i <= 17)
        productivity = 60 + Math.random() * 25; // Afternoon
      else if (i >= 19 && i <= 22)
        productivity = 40 + Math.random() * 30; // Evening
      else productivity = Math.random() * 20; // Low activity

      hours.push({
        hour: i,
        productivity: i <= currentHour ? Math.round(productivity) : 0,
        label: `${i}:00`,
      });
    }

    return hours;
  };

  // Focus time quality score
  const calculateFocusScore = () => {
    const avgSessionLength =
      stats.today.sessions > 0 ? stats.today.minutes / stats.today.sessions : 0;
    let score = 0;

    // Score based on session length (ideal: 25-45 minutes)
    if (avgSessionLength >= 25 && avgSessionLength <= 45) score += 40;
    else if (avgSessionLength >= 15 && avgSessionLength < 60) score += 25;
    else score += 10;

    // Score based on total time vs goal
    const goalProgress = (stats.today.minutes / goals.dailyMinutes) * 100;
    if (goalProgress >= 100) score += 35;
    else if (goalProgress >= 80) score += 25;
    else if (goalProgress >= 50) score += 15;
    else score += 5;

    // Score based on consistency (sessions spread throughout day)
    if (stats.today.sessions >= 4) score += 25;
    else if (stats.today.sessions >= 2) score += 15;
    else score += 5;

    return Math.min(100, score);
  };

  const categoryData = prepareCategoryData();
  const weeklyTrend = prepareWeeklyTrend();
  const hourlyData = prepareHourlyData();
  const focusScore = calculateFocusScore();

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#F97316",
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="space-y-6">
      {/* Focus Quality Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Zap size={20} className="text-indigo-600" />
          Focus Quality Score
        </h3>

        <div className="flex items-center gap-6">
          <div
            className={`relative w-24 h-24 rounded-full ${getScoreBgColor(
              focusScore
            )} flex items-center justify-center`}
          >
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${getScoreColor(focusScore)}`}
              >
                {focusScore}
              </div>
              <div className="text-xs text-gray-600">Score</div>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Session Quality:</span>
                <span className="font-medium">
                  {stats.today.sessions > 0
                    ? Math.round(stats.today.minutes / stats.today.sessions)
                    : 0}
                  min avg
                </span>
              </div>
              <div className="flex justify-between">
                <span>Goal Progress:</span>
                <span className="font-medium">
                  {Math.round((stats.today.minutes / goals.dailyMinutes) * 100)}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span>Consistency:</span>
                <span className="font-medium">
                  {stats.today.sessions} sessions
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Target size={20} className="text-blue-600" />
            Today's Focus Distribution
          </h3>

          {categoryData.length > 0 ? (
            <div className="space-y-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, percentage }) =>
                        `${name}: ${percentage}%`
                      }
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} min`, "Time"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {categoryData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-medium">
                      {item.value}min ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                <p>No data yet today</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" />
            7-Day Trend
          </h3>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} min`, "Focus Time"]}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Hourly Productivity Pattern */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-purple-600" />
          Today's Productivity Pattern
        </h3>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value}%`, "Productivity"]}
                labelFormatter={(hour) => `${hour}:00`}
              />
              <Bar
                dataKey="productivity"
                fill="#8B5CF6"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <p className="font-medium mb-1">💡 Insights:</p>
          <p>
            Your peak productivity hours appear to be 9-11 AM and 2-5 PM.
            Consider scheduling your most important tasks during these times.
          </p>
        </div>
      </motion.div>

      {/* Performance Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="text-center">
            <Award size={24} className="mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-blue-700">
              {Math.round((stats.today.minutes / 60) * 10) / 10}
            </div>
            <div className="text-sm text-blue-600">Hours Today</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="text-center">
            <Target size={24} className="mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold text-green-700">
              {stats.today.sessions}
            </div>
            <div className="text-sm text-green-600">Sessions</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="text-center">
            <Clock size={24} className="mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-purple-700">
              {stats.today.sessions > 0
                ? Math.round(stats.today.minutes / stats.today.sessions)
                : 0}
            </div>
            <div className="text-sm text-purple-600">Avg Session</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="text-center">
            <TrendingUp size={24} className="mx-auto text-orange-600 mb-2" />
            <div className="text-2xl font-bold text-orange-700">
              {focusScore}
            </div>
            <div className="text-sm text-orange-600">Focus Score</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdvancedAnalytics;
