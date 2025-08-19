import { useEffect, useState } from "react";
import { TASK_CATEGORIES } from "../../utils/taskCategories";
import { XCircleIcon } from "../Icons";

export const AddTaskModal = ({ isOpen, onClose, onAddTask }) => {
  const [taskText, setTaskText] = useState("");
  const [isDaily, setIsDaily] = useState(false);
  const [priority, setPriority] = useState("normal");
  const [repeatType, setRepeatType] = useState("none");
  const [selectedDays, setSelectedDays] = useState([]);
  const [category, setCategory] = useState("personal");

  const weekDays = [
    { short: "Sun", full: "Sunday" },
    { short: "Mon", full: "Monday" },
    { short: "Tue", full: "Tuesday" },
    { short: "Wed", full: "Wednesday" },
    { short: "Thu", full: "Thursday" },
    { short: "Fri", full: "Friday" },
    { short: "Sat", full: "Saturday" },
  ];

  useEffect(() => {
    if (!isOpen) {
      setTaskText("");
      setIsDaily(false);
      setPriority("normal");
      setRepeatType("none");
      setSelectedDays([]);
      setCategory("personal");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (taskText.trim()) {
      const taskData = {
        text: taskText.trim(),
        isDaily: isDaily || repeatType !== "none",
        priority,
        repeatType,
        selectedDays: repeatType === "custom" ? selectedDays : [],
        category,
        createdAt: new Date().toISOString(),
      };
      onAddTask(taskData);
      onClose();
    }
  };

  const handleDayToggle = (dayIndex) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop z-50 flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Add New Task</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircleIcon className="w-8 h-8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Task Name
            </label>
            <input
              type="text"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="Enter your task..."
              className="w-full p-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              autoFocus
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              {TASK_CATEGORIES.filter((cat) => cat.id !== "all").map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Priority Level
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPriority("normal")}
                className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                  priority === "normal"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setPriority("high")}
                className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                  priority === "high"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                🔥 High Priority
              </button>
            </div>
          </div>

          {/* Repeat Options */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Repeat Pattern
            </label>
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRepeatType("none")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                    repeatType === "none"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  No Repeat
                </button>
                <button
                  type="button"
                  onClick={() => setRepeatType("daily")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                    repeatType === "daily"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  Daily
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRepeatType("weekly")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                    repeatType === "weekly"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setRepeatType("custom")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                    repeatType === "custom"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  Custom Days
                </button>
              </div>
            </div>
          </div>

          {/* Custom Days Selection */}
          {repeatType === "custom" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Days
              </label>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDayToggle(index)}
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${
                      selectedDays.includes(index)
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
              {selectedDays.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected:{" "}
                  {selectedDays.map((i) => weekDays[i].full).join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
