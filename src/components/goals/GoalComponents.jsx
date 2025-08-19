import { motion } from "framer-motion";
import { useState } from "react";

export const GoalCard = ({ goal, onUpdate, onDelete }) => {
  const progressPercentage =
    goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
  const isCompleted = progressPercentage >= 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`p-4 rounded-xl border-2 transition-all ${
        isCompleted
          ? "bg-green-50 border-green-200"
          : "bg-white border-gray-200 hover:border-indigo-300"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3
            className={`font-semibold text-lg ${
              isCompleted ? "text-green-800" : "text-gray-800"
            }`}
          >
            {goal.title}
          </h3>
          <p className="text-gray-600 text-sm mt-1">{goal.description}</p>
        </div>
        <div className="flex gap-2 ml-3">
          <button
            onClick={() => onUpdate(goal.id)}
            className="p-1 text-gray-500 hover:text-indigo-600 transition-colors"
            title="Update progress"
          >
            📈
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
            title="Delete goal"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span
            className={`font-medium ${
              isCompleted ? "text-green-600" : "text-indigo-600"
            }`}
          >
            {goal.current} / {goal.target} {goal.unit}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              isCompleted ? "bg-green-500" : "bg-indigo-500"
            }`}
          />
        </div>
        <div className="text-right mt-1">
          <span
            className={`text-xs font-medium ${
              isCompleted ? "text-green-600" : "text-indigo-600"
            }`}
          >
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>🎯 {goal.category}</span>
        <span>📅 Due: {new Date(goal.deadline).toLocaleDateString()}</span>
      </div>

      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-2 bg-green-100 rounded-lg text-center"
        >
          <span className="text-green-800 font-medium">
            🎉 Goal Completed! 🎉
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export const AddGoalModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target: "",
    unit: "tasks",
    category: "study",
    deadline: "",
  });

  const goalCategories = [
    { value: "study", label: "Study", icon: "📚" },
    { value: "work", label: "Work", icon: "💼" },
    { value: "health", label: "Health", icon: "💪" },
    { value: "personal", label: "Personal", icon: "🏠" },
    { value: "reading", label: "Reading", icon: "📖" },
  ];

  const units = [
    { value: "tasks", label: "Tasks" },
    { value: "hours", label: "Hours" },
    { value: "pages", label: "Pages" },
    { value: "days", label: "Days" },
    { value: "projects", label: "Projects" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.target && formData.deadline) {
      onSave({
        ...formData,
        target: parseInt(formData.target),
        current: 0,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      });
      setFormData({
        title: "",
        description: "",
        target: "",
        unit: "tasks",
        category: "study",
        deadline: "",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Create New Goal
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Complete React Course"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Additional details about your goal..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target
              </label>
              <input
                type="number"
                value={formData.target}
                onChange={(e) =>
                  setFormData({ ...formData, target: e.target.value })
                }
                placeholder="100"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
              >
                {units.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {goalCategories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, category: category.value })
                  }
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.category === category.value
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category.icon} {category.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Goal
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
