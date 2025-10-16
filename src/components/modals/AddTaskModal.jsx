import { useEffect, useState } from "react";
import { TASK_CATEGORIES } from "../../utils/taskCategories";
import { Modal } from "../common/Modal";

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✨ Add New Task" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Task Name */}
        <div>
          <label
            htmlFor="task-text"
            className="block text-sm font-semibold text-gray-800 mb-2"
          >
            📝 Task Name
          </label>
          <input
            type="text"
            id="task-text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-gray-800 placeholder-gray-400"
            autoFocus
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            🏷️ Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-gray-800 font-medium bg-white cursor-pointer"
          >
            {TASK_CATEGORIES.filter((cat) => cat.id !== "all").map((cat) => (
              <option key={cat.id} value={cat.id} className="py-2">
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            ⭐ Priority Level
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Normal Priority */}
            <button
              type="button"
              onClick={() => setPriority("normal")}
              className={`px-4 py-4 rounded-xl border-2 transition-all duration-150 font-semibold ${
                priority === "normal"
                  ? "border-blue-500 bg-blue-500 text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span className="text-sm">Normal</span>
              </div>
            </button>

            {/* High Priority */}
            <button
              type="button"
              onClick={() => setPriority("high")}
              className={`px-4 py-4 rounded-xl border-2 transition-all duration-150 font-semibold ${
                priority === "high"
                  ? "border-red-500 bg-red-500 text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-700 hover:border-red-400 hover:bg-red-50"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">�</span>
                <span className="text-sm">High</span>
              </div>
            </button>
          </div>
        </div>

        {/* Repeat Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            🔁 Repeat Schedule
          </label>
          <select
            value={repeatType}
            onChange={(e) => setRepeatType(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-gray-800 font-medium bg-white cursor-pointer"
          >
            <option value="none">📌 One Time Task</option>
            <option value="daily">📅 Daily</option>
            <option value="weekly">📆 Weekly (Select Days)</option>
            <option value="custom">⚙️ Custom Days</option>
          </select>
        </div>

        {/* Day Selection for Weekly/Custom */}
        {(repeatType === "weekly" || repeatType === "custom") && (
          <div className="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-100">
            <label className="block text-sm font-semibold text-indigo-900 mb-3">
              📍 Select Days
            </label>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDayToggle(index)}
                  className={`px-2 py-3 rounded-lg border-2 transition-all font-semibold text-xs ${
                    selectedDays.includes(index)
                      ? "border-indigo-500 bg-indigo-500 text-white shadow-md"
                      : "border-indigo-200 bg-white text-indigo-600 hover:border-indigo-400 hover:bg-indigo-100"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>{day.short}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold border-2 border-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
          >
            ✅ Add Task
          </button>
        </div>
      </form>
    </Modal>
  );
};
