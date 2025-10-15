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
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-2 sm:p-4 pt-4 sm:pt-8 animate-fade-in overflow-y-auto">
      {" "}
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal - Optimized for Mobile, always centered regardless of scroll */}
      <div className="relative bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] border border-white/50 animate-slide-up flex flex-col">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl -z-0" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Fixed Header */}
          <div className="flex justify-between items-center p-4 sm:p-6 pb-4 border-b border-white/30">
            <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
              Add New Task
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all hover:scale-110"
            >
              <XCircleIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Task Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Task Name
                </label>
                <input
                  type="text"
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full p-3 sm:p-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-indigo-300"
                  autoFocus
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {TASK_CATEGORIES.filter((cat) => cat.id !== "all").map(
                    (cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 sm:p-4 rounded-2xl border-2 transition-all text-left ${
                          category === cat.id
                            ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg"
                            : "border-gray-200 bg-white/80 hover:border-indigo-300 hover:shadow-md"
                        }`}
                      >
                        <div className="text-xl sm:text-2xl mb-1">
                          {cat.icon}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-gray-900">
                          {cat.name}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Priority Level
                </label>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPriority("normal")}
                    className={`flex-1 p-3 sm:p-4 rounded-2xl border-2 font-semibold transition-all text-sm sm:text-base ${
                      priority === "normal"
                        ? "border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-lg"
                        : "border-gray-200 bg-white/80 text-gray-700 hover:border-blue-300 hover:shadow-md"
                    }`}
                  >
                    📋 Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("high")}
                    className={`flex-1 p-3 sm:p-4 rounded-2xl border-2 font-semibold transition-all text-sm sm:text-base ${
                      priority === "high"
                        ? "border-red-500 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 shadow-lg"
                        : "border-gray-200 bg-white/80 text-gray-700 hover:border-red-300 hover:shadow-md"
                    }`}
                  >
                    🔥 High Priority
                  </button>
                </div>
              </div>

              {/* Repeat Options */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Repeat Pattern
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setRepeatType("none")}
                    className={`p-3 sm:p-4 rounded-2xl border-2 font-semibold transition-all text-sm sm:text-base ${
                      repeatType === "none"
                        ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 shadow-lg"
                        : "border-gray-200 bg-white/80 text-gray-700 hover:border-indigo-300 hover:shadow-md"
                    }`}
                  >
                    🚫 No Repeat
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatType("daily")}
                    className={`p-3 sm:p-4 rounded-2xl border-2 font-semibold transition-all text-sm sm:text-base ${
                      repeatType === "daily"
                        ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 shadow-lg"
                        : "border-gray-200 bg-white/80 text-gray-700 hover:border-indigo-300 hover:shadow-md"
                    }`}
                  >
                    📅 Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatType("weekly")}
                    className={`p-3 sm:p-4 rounded-2xl border-2 font-semibold transition-all text-sm sm:text-base ${
                      repeatType === "weekly"
                        ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 shadow-lg"
                        : "border-gray-200 bg-white/80 text-gray-700 hover:border-indigo-300 hover:shadow-md"
                    }`}
                  >
                    🔄 Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatType("custom")}
                    className={`p-3 sm:p-4 rounded-2xl border-2 font-semibold transition-all text-sm sm:text-base ${
                      repeatType === "custom"
                        ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 shadow-lg"
                        : "border-gray-200 bg-white/80 text-gray-700 hover:border-indigo-300 hover:shadow-md"
                    }`}
                  >
                    ⚙️ Custom Days
                  </button>
                </div>
              </div>

              {/* Custom Days Selection */}
              {repeatType === "custom" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Select Days
                  </label>
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {weekDays.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleDayToggle(index)}
                        className={`p-2 sm:p-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                          selectedDays.includes(index)
                            ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg scale-105"
                            : "bg-white/80 text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                  {selectedDays.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2 sm:mt-3 p-2 sm:p-3 bg-indigo-50 rounded-xl">
                      <span className="font-semibold">Selected:</span>{" "}
                      {selectedDays.map((i) => weekDays[i].full).join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Fixed Action Buttons at Bottom */}
          <div className="p-4 sm:p-6 pt-3 border-t border-white/30 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20">
            <div className="flex gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-2xl font-bold hover:from-gray-200 hover:to-gray-300 transition-all hover:shadow-lg text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  const form = e.target
                    .closest(".relative")
                    .querySelector("form");
                  if (form) {
                    form.dispatchEvent(
                      new Event("submit", { cancelable: true, bubbles: true })
                    );
                  }
                }}
                className="flex-1 py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base"
              >
                ✓ Add Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
