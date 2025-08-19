import {
  Bar,
  BarChart,
  CartesianGrid,
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

const COLORS = [
  "#8B5CF6",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#6366F1",
];

export const TaskCompletionChart = ({ completedTasks, totalTasks }) => {
  const data = [
    { name: "Completed", value: completedTasks, color: "#10B981" },
    { name: "Remaining", value: totalTasks - completedTasks, color: "#E5E7EB" },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Task Completion
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <p className="text-2xl font-bold text-gray-800">
          {completedTasks}/{totalTasks}
        </p>
        <p className="text-sm text-gray-600">Tasks Completed</p>
      </div>
    </div>
  );
};

export const CategoryProgressChart = ({ categoryData }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Progress by Category
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={categoryData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="completed" fill="#8B5CF6" />
          <Bar dataKey="total" fill="#E5E7EB" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const WeeklyProgressChart = ({ weeklyData }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Weekly Progress Trend
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={weeklyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="progress"
            stroke="#8B5CF6"
            strokeWidth={3}
            dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const StudyTimeChart = ({ studyData }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Daily Study Hours
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={studyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="hours" fill="#06B6D4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Main Progress Charts component that combines all charts
export const ProgressCharts = ({ todayTasks, roadmap, books, className }) => {
  // Calculate data for charts
  const completedTasks = todayTasks.filter((task) => task.completed).length;
  const totalTasks = todayTasks.length;

  // Category data
  const categoryData = todayTasks.reduce((acc, task) => {
    const category = task.category || "personal";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryData).map(
    ([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[index % COLORS.length],
    })
  );

  // Weekly progress data (mock data for now)
  const weeklyData = [
    { week: "Week 1", progress: 75 },
    { week: "Week 2", progress: 82 },
    { week: "Week 3", progress: 68 },
    { week: "Week 4", progress: 90 },
  ];

  // Study time data (mock data for now)
  const studyData = [
    { day: "Mon", hours: 2.5 },
    { day: "Tue", hours: 3.2 },
    { day: "Wed", hours: 1.8 },
    { day: "Thu", hours: 4.1 },
    { day: "Fri", hours: 2.9 },
    { day: "Sat", hours: 3.7 },
    { day: "Sun", hours: 2.1 },
  ];

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className || ""}`}>
      <TaskCompletionChart
        completedTasks={completedTasks}
        totalTasks={totalTasks}
      />
      <CategoryProgressChart categoryData={categoryChartData} />
      <WeeklyProgressChart weeklyData={weeklyData} />
      <StudyTimeChart studyData={studyData} />
    </div>
  );
};
