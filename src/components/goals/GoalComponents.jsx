import { motion } from "framer-motion";
import { useState } from "react";

export const GoalCard = ({ goal, onUpdate, onDelete }) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const progressPercentage =
    goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
  const isCompleted = progressPercentage >= 100;

  const handleUpdateProgress = (newProgress) => {
    onUpdate({
      ...goal,
      current: Math.min(newProgress, goal.target),
    });
    setShowUpdateModal(false);
  };

  return (
    <>
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
              onClick={() => setShowUpdateModal(true)}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Update progress"
            >
              📈
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Progress Update Modal */}
      <UpdateProgressModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        goal={goal}
        onUpdate={handleUpdateProgress}
      />
    </>
  );
};

// Progress Update Modal Component
export const UpdateProgressModal = ({ isOpen, onClose, goal, onUpdate }) => {
  const [inputValue, setInputValue] = useState("");
  const [updateType, setUpdateType] = useState("set"); // "set" or "add"

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = parseFloat(inputValue);
    if (isNaN(value) || value < 0) return;

    let newProgress;
    if (updateType === "add") {
      newProgress = goal.current + value;
    } else {
      newProgress = value;
    }

    onUpdate(newProgress);
    setInputValue("");
  };

  const handleQuickAdd = (amount) => {
    const newProgress = goal.current + amount;
    onUpdate(newProgress);
  };

  if (!isOpen) return null;

  const progressPercentage =
    goal.target > 0 ? (goal.current / goal.target) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Update Progress: {goal.title}
        </h2>

        {/* Current Progress */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Current Progress</span>
            <span className="font-medium text-indigo-600">
              {goal.current} / {goal.target} {goal.unit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="text-right mt-1">
            <span className="text-xs text-indigo-600 font-medium">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Add</h3>
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 25].map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickAdd(amount)}
                className="p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
              >
                +{amount}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUpdateType("set")}
                className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                  updateType === "set"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Set Total
              </button>
              <button
                type="button"
                onClick={() => setUpdateType("add")}
                className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                  updateType === "add"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Add Amount
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {updateType === "set" ? `Total ${goal.unit}` : `Add ${goal.unit}`}
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                updateType === "set" ? `Current: ${goal.current}` : "0"
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
              min="0"
              step="0.1"
            />
          </div>

          <div className="flex gap-3 pt-4 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inputValue}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Update
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const AddGoalModal = ({ isOpen, onClose, onAdd }) => {
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
      onAdd({
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
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

          <div className="flex gap-3 pt-4 pb-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Create Goal
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
