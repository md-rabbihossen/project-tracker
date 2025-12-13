import { useEffect, useMemo, useRef, useState } from "react";
import DigitalTimerSound from "./assets/Digital Timer.mp3";
import Logo from "./assets/logo.png";
import Profile from "./assets/profile.jpg";
import {
  addPomodoroTime,
  checkAndResetMonthlyStats,
  checkAndResetWeeklyStats,
  resetDailyPomodoroStats,
} from "./utils/pomodoroStats";

// Supabase sync imports
import LoginPage from "./components/LoginPage";
import {
  handleLogout,
  SyncStatusIndicator,
  useSupabaseSync,
} from "./hooks/useSupabaseSync";
import { syncData } from "./services/supabase";

// Import components
import {
  ArrowPathIcon,
  BarChart2Icon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  DragHandleIcon,
  ForwardIcon,
  HomeIcon,
  PencilIcon,
  PlusCircleIcon,
  TrashIcon,
  UserCircleIcon,
} from "./components/Icons";

import { PomodoroAnalytics } from "./components/analytics/PomodoroAnalytics";
import { MobileFilter } from "./components/common/MobileFilter";
import { Modal } from "./components/common/Modal";
import { ProgressBar } from "./components/common/ProgressBar";
import { AddTaskForm } from "./components/forms/AddTaskForm";
import { AddGoalModal } from "./components/goals/GoalComponents";
import { CustomToaster } from "./components/notifications/ToastNotifications";
import { CountdownTimer } from "./components/sections/CountdownTimer";
import { PomodoroTimer } from "./components/timer/PomodoroTimer";

// Lucide React icons
import { Clock, X } from "lucide-react";

// Import utilities
import {
  addToTodayProgress,
  calculateWeekProgress,
  formatDailyMinutes,
  formatProgress,
  getCurrentWeekNumber,
  getDateString,
  getInitialBooks,
  getTodayProgress,
  getWeekInfo,
  quotes,
  saveBooksToStorage,
  saveTodayProgress,
  shouldShowTaskToday,
} from "./utils/helpers";

import { TASK_CATEGORIES } from "./utils/taskCategories";
import "./utils/toastUtils"; // Import to set up global toast function

const TodayTasksSection = ({
  tasks,
  completedOneTimeTasks = [],
  skippedTasks = [],
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onSkipTask,
  selectedCategory,
  onCategoryChange,
  filterType,
  onFilterChange,
  sortType,
  onSortChange,
}) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState("");

  // Filter tasks that should be shown today and apply category/filter/sort
  // Get IDs of completed one-time tasks to exclude from main list
  const completedOneTimeTaskIds = new Set(
    completedOneTimeTasks.map((t) => t.id)
  );

  // Get IDs of tasks skipped today
  const today = getDateString();
  const skippedTaskIdsToday = new Set(
    skippedTasks.filter((st) => st.skipDate === today).map((st) => st.taskId)
  );

  console.log("🔍 Exclusion Debug:", {
    completedOneTimeTaskIdsCount: completedOneTimeTaskIds.size,
    completedOneTimeTasksLength: completedOneTimeTasks.length,
    skippedTodayCount: skippedTaskIdsToday.size,
    skippedTasks: skippedTasks.map((st) => ({
      taskId: st.taskId,
      skipDate: st.skipDate,
      taskName: st.taskData?.text,
      repeatType: st.taskData?.repeatType,
      selectedDays: st.taskData?.selectedDays,
    })),
    todayDate: today,
    todayDayOfWeek: new Date().getDay(),
    tasksBeforeFilter: tasks.length,
    tasksWithRepeatInfo: tasks.slice(0, 5).map((t) => ({
      id: t.id,
      text: t.text,
      repeatType: t.repeatType,
      selectedDays: t.selectedDays,
      shouldShow: shouldShowTaskToday(t),
      isSkipped: skippedTaskIdsToday.has(t.id),
    })),
  });

  const todayTasks = tasks
    .filter((task) => shouldShowTaskToday(task))
    .filter((task) => !completedOneTimeTaskIds.has(task.id)) // Exclude if already in completedOneTimeTasks
    .filter((task) => !skippedTaskIdsToday.has(task.id)) // Exclude if skipped today
    .filter((task) => {
      // Category filter
      if (selectedCategory !== "all" && task.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (filterType === "completed" && !task.completed) {
        return false;
      }
      if (filterType === "pending" && task.completed) {
        return false;
      }
      if (filterType === "high-priority" && task.priority !== "high") {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by selected sort type
      switch (sortType) {
        case "priority":
          // High priority tasks come first
          if (a.priority === "high" && b.priority !== "high") return -1;
          if (b.priority === "high" && a.priority !== "high") return 1;
          return 0;
        case "name":
          return a.text.localeCompare(b.text);
        case "created":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

  const visibleTasks = todayTasks.filter((task) => !task.completed);

  // IMPORTANT: Separate one-time tasks from recurring tasks
  // One-time tasks should ONLY be counted from completedOneTimeTasks array
  // Recurring tasks are counted from todayTasks array

  // Get only recurring/repeating tasks from todayTasks
  const recurringTasksOnly = todayTasks.filter(
    (task) => task.repeatType && task.repeatType !== "none"
  );

  // Count completed recurring tasks
  const completedRecurringTasks = recurringTasksOnly.filter(
    (task) => task.completed
  ).length;

  // Filter completed one-time tasks by selected category
  const filteredCompletedOneTimeTasks = completedOneTimeTasks.filter((task) => {
    // Apply category filter
    if (selectedCategory !== "all" && task.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const completedOneTimeTasksCount = filteredCompletedOneTimeTasks.length;

  // Total tasks = recurring tasks + completed one-time tasks
  // (We only show completed one-time tasks, uncompleted ones are in todayTasks)
  const totalTasks = todayTasks.length + filteredCompletedOneTimeTasks.length;
  const totalCompletedTasks =
    completedRecurringTasks + completedOneTimeTasksCount;
  const progress =
    totalTasks > 0 ? (totalCompletedTasks / totalTasks) * 100 : 0;
  const remainingTasks = visibleTasks.length;

  // Debug logging (temporary)
  const completedOneTimeInTodayTasks = todayTasks.filter(
    (t) => t.completed && (!t.repeatType || t.repeatType === "none")
  );
  console.log("✅ Fixed Count Debug:", {
    todayTasksTotal: todayTasks.length,
    recurringOnly: recurringTasksOnly.length,
    completedRecurring: completedRecurringTasks,
    completedOneTime: completedOneTimeTasksCount,
    totalCompleted: totalCompletedTasks,
    WARNING_oneTimeStillInTodayTasks: completedOneTimeInTodayTasks.length,
    WARNING_details:
      completedOneTimeInTodayTasks.length > 0
        ? completedOneTimeInTodayTasks.map((t) => ({
            id: t.id,
            text: t.text.substring(0, 20),
          }))
        : "None (good!)",
  });

  // Calculate task counts by category for the filter
  const taskCounts = tasks
    .filter((task) => shouldShowTaskToday(task))
    .reduce((acc, task) => {
      const category = task.category || "personal";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

  const handleStartEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskText("");
  };

  const handleSaveEdit = () => {
    if (editingTaskText.trim()) {
      onEditTask(editingTaskId, editingTaskText.trim());
    }
    handleCancelEdit();
  };

  const getRepeatBadge = (task) => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // 🐛 DEBUG: Log task details for badge rendering
    console.log("🎯 Badge Debug for task:", {
      taskId: task.id,
      taskName: task.text,
      repeatType: task.repeatType,
      isDaily: task.isDaily,
      selectedDays: task.selectedDays,
      repeatDays: task.repeatDays,
      fullTask: task,
    });

    // Check repeatType FIRST before isDaily (because custom/weekly also have isDaily=true)
    if (task.repeatType === "custom") {
      const days = (task.selectedDays || task.repeatDays || []).map(
        (dayIndex) => dayNames[dayIndex]
      );
      console.log("✅ Showing CUSTOM badge with days:", days);
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200 shadow-sm">
          <span>📆</span> {days.length > 0 ? days.join(", ") : "Custom"}
        </span>
      );
    }

    if (task.repeatType === "weekly") {
      const days = (task.selectedDays || task.repeatDays || []).map(
        (dayIndex) => dayNames[dayIndex]
      );
      console.log("✅ Showing WEEKLY badge with days:", days);
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full border border-purple-200 shadow-sm">
          <span>🔄</span> {days.length > 0 ? days.join(", ") : "Weekly"}
        </span>
      );
    }

    if (task.isDaily || task.repeatType === "daily") {
      console.log("✅ Showing DAILY badge");
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full border border-blue-200 shadow-sm">
          <span>📅</span> Daily
        </span>
      );
    }

    console.log("❌ No badge condition met - returning null");
    return null;
  };

  return (
    <section className="relative bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 rounded-3xl p-6 sm:p-8 shadow-xl border border-white/50 backdrop-blur-sm overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl -z-0" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl -z-0" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                Today's Tasks
              </h2>
              <span className="text-lg sm:text-xl font-medium text-gray-600">
                {new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
                , {new Date().toLocaleDateString("en-US", { weekday: "short" })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-indigo-700 font-semibold shadow-sm border border-indigo-100">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                {remainingTasks} Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-green-700 font-semibold shadow-sm border border-green-100">
                <span className="text-green-500">✓</span>
                {totalCompletedTasks} Done
              </span>
              <span className="text-base font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-indigo-100/50">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <MobileFilter
            categories={TASK_CATEGORIES}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            filterType={filterType}
            onFilterChange={onFilterChange}
            sortType={sortType}
            onSortChange={onSortChange}
            taskCounts={taskCounts}
          />
        </div>

        {/* Add New Task Button - Top of Section */}
        <div className="mb-6">
          <AddTaskForm onAddTask={onAddTask} isTodaySection={true} />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar percentage={progress} showPercentage={true} />
        </div>

        {/* Tasks List */}
        <ul className="space-y-3">
          {visibleTasks.map((task) => (
            <li
              key={task.id}
              className="group relative bg-white/60 backdrop-blur-sm hover:bg-white rounded-2xl transition-all duration-300 border border-gray-200/50 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50"
            >
              <div className="flex items-start p-5">
                {/* Checkbox */}
                <div className="flex-shrink-0 pt-1">
                  <input
                    type="checkbox"
                    id={task.id}
                    checked={task.completed}
                    onChange={() => onToggleTask(task.id)}
                    className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/30 cursor-pointer transition-all hover:border-indigo-400 hover:scale-110"
                  />
                </div>

                {/* Content */}
                <div className="ml-4 flex-grow min-w-0">
                  {editingTaskId === task.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingTaskText}
                        onChange={(e) => setEditingTaskText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                        className="w-full text-base text-gray-900 bg-white border-2 border-indigo-400 focus:border-indigo-600 outline-none rounded-xl px-3 py-2 transition-colors"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-5 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <label
                          htmlFor={task.id}
                          className={`text-base leading-relaxed cursor-pointer transition-all flex-grow ${
                            task.completed
                              ? "line-through text-gray-400"
                              : "text-gray-900 font-medium group-hover:text-indigo-900"
                          }`}
                        >
                          {task.priority === "high" && (
                            <span className="inline-block mr-2 text-base">
                              🔥
                            </span>
                          )}
                          <span className="break-words">{task.text}</span>
                        </label>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                          <button
                            onClick={() => onSkipTask(task.id)}
                            className="p-2.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all hover:scale-110"
                            title="Skip for today"
                          >
                            <ForwardIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(task)}
                            className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all hover:scale-110"
                            title="Edit task"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110"
                            title="Delete task"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Badges */}
                      {(task.priority === "high" ||
                        task.isDaily ||
                        task.repeatType === "daily" ||
                        task.repeatType === "weekly" ||
                        (task.category && task.category !== "personal")) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {task.priority === "high" && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-red-700 bg-gradient-to-r from-red-50 to-orange-50 rounded-full border border-red-200 shadow-sm">
                              <span>🔥</span> High Priority
                            </span>
                          )}
                          {getRepeatBadge(task)}
                          {task.category && task.category !== "personal" && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full border border-gray-200">
                              {
                                TASK_CATEGORIES.find(
                                  (c) => c.id === task.category
                                )?.icon
                              }{" "}
                              {TASK_CATEGORIES.find(
                                (c) => c.id === task.category
                              )?.name || task.category}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {/* Add Task Form */}
        <div className="mt-6">
          <AddTaskForm onAddTask={onAddTask} isTodaySection={true} />
        </div>
      </div>
    </section>
  );
};

const Week = ({
  weekData,
  onDeleteTask,
  onEditTask,
  onRenameTitle,
  isCurrentWeek,
  isFirstVisibleWeek,
  onOpenNewTaskModal,
  onOpenProgressModal,
}) => {
  const [isOpen, setIsOpen] = useState(isCurrentWeek || isFirstVisibleWeek);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(weekData.title);

  useEffect(() => {
    setIsOpen(isCurrentWeek || isFirstVisibleWeek);
  }, [isCurrentWeek, isFirstVisibleWeek]);

  const weekProgress = useMemo(
    () => calculateWeekProgress(weekData),
    [weekData]
  );

  const handleStartEdit = (topic) => {
    setEditingTaskId(topic.id);
    setEditingTaskText(topic.text);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskText("");
  };

  const handleSaveEdit = () => {
    if (editingTaskText.trim())
      onEditTask(editingTaskId, editingTaskText.trim());
    handleCancelEdit();
  };

  const handleTitleSave = () => {
    if (newTitle.trim() && newTitle.trim() !== weekData.title)
      onRenameTitle(weekData.week, newTitle.trim());
    setIsEditingTitle(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm border-2 border-white/50 rounded-3xl mb-6 shadow-xl transition-all duration-300 hover:shadow-2xl relative overflow-hidden">
      {/* Decorative blur elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl -z-10"></div>

      <div
        className="w-full p-6 text-left flex justify-between items-center cursor-pointer"
        onClick={() => !isEditingTitle && setIsOpen(!isOpen)}
      >
        <div>
          <div className="text-sm flex items-center gap-4 flex-wrap">
            <span className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm">
              <CalendarIcon className="w-4 h-4 mr-2 text-indigo-600" />
              <span className="font-bold text-gray-700">
                Week {weekData.week}
              </span>
            </span>
            <span className="text-gray-600 font-medium">
              {weekData.weekInfo.rangeString}
            </span>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              {weekData.weekInfo.remainingString}
            </span>
          </div>
          {!isEditingTitle ? (
            <div className="flex items-center group">
              <h3 className="text-xl font-bold text-gray-900 mt-2">
                {weekData.title}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }}
                className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <PencilIcon className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                className="p-2 border-2 border-indigo-500 rounded-xl text-lg font-bold outline-none bg-white/80 backdrop-blur-sm"
                autoFocus
              />
              <button
                onClick={handleTitleSave}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Save
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-base font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm">
            {weekProgress.toFixed(2)}%
          </span>
          <ChevronDownIcon
            className={`w-7 h-7 text-gray-600 transform transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>
      {isOpen && (
        <div className="px-6 pb-6">
          <ProgressBar percentage={weekProgress} />
          <ul className="mt-6 space-y-4">
            {weekData.topics.map((topic) => {
              let taskProgress = 0;
              if (topic.type === "book") {
                const completed = topic.completedPages || 0;
                const total = topic.totalPages || 1;
                taskProgress = (completed / total) * 100;
              } else if (topic.type === "day") {
                const completed = topic.completedDays || 0;
                const total = topic.totalDays || 1;
                taskProgress = (completed / total) * 100;
              } else if (topic.type === "simple") {
                taskProgress = topic.completed ? 100 : 0;
              } else {
                const completed = topic.completedMinutes || 0;
                const total = topic.totalMinutes || 1;
                taskProgress = (completed / total) * 100;
              }
              return (
                <li
                  key={topic.id}
                  className="p-5 bg-white/60 backdrop-blur-sm rounded-2xl group shadow-md hover:shadow-lg transition-all border border-white/50"
                >
                  <div className="flex justify-between items-center mb-3">
                    {editingTaskId === topic.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editingTaskText}
                          onChange={(e) => setEditingTaskText(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveEdit()
                          }
                          className="flex-grow text-base font-bold border-2 border-indigo-500 rounded-xl p-2 outline-none bg-white/80 backdrop-blur-sm"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-bold hover:shadow-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center flex-grow gap-3">
                        {topic.type === "simple" ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle completion status
                                onEditTask(topic.id, topic.text, {
                                  completed: !topic.completed,
                                });
                              }}
                              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${
                                topic.completed
                                  ? "bg-gradient-to-br from-green-500 to-emerald-500 border-green-400 text-white shadow-lg scale-105"
                                  : "border-gray-300 hover:border-indigo-400 bg-white"
                              }`}
                            >
                              {topic.completed && (
                                <CheckCircleIcon className="w-4 h-4" />
                              )}
                            </button>
                            <h4
                              className={`font-bold text-base flex-grow ${
                                topic.completed
                                  ? "text-gray-500 line-through"
                                  : "text-gray-800"
                              }`}
                            >
                              {topic.text}
                            </h4>
                          </>
                        ) : (
                          <h4 className="font-bold text-base text-gray-800 flex-grow">
                            {topic.text}
                          </h4>
                        )}
                      </div>
                    )}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 gap-1">
                      <button
                        onClick={() => handleStartEdit(topic)}
                        className="p-2 text-gray-500 hover:text-indigo-600 rounded-xl hover:bg-white/80 transition-all"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(topic.id)}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-xl hover:bg-white/80 transition-all"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {topic.type !== "simple" && (
                    <div className="flex justify-between items-center text-sm mb-3">
                      <span className="text-gray-700 font-medium">
                        {formatProgress(topic)}
                      </span>
                      <span className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        {taskProgress.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {topic.type === "simple" ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-grow text-sm">
                        <span
                          className={`font-bold ${
                            topic.completed ? "text-green-600" : "text-gray-600"
                          }`}
                        >
                          {topic.completed ? "✓ Completed" : ""}
                        </span>
                      </div>
                      {topic.completed && (
                        <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-md">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-grow">
                        <ProgressBar percentage={taskProgress} />
                      </div>
                      <button
                        onClick={() => onOpenProgressModal(topic)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-xs font-bold shadow-md hover:shadow-lg hover:scale-105"
                      >
                        + Add Progress
                      </button>
                      {taskProgress >= 100 && (
                        <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-md">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-6 pt-6 border-t border-white/20">
            <button
              onClick={() => onOpenNewTaskModal(weekData.week)}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Add New Weekly Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const QuoteSection = ({ quote, onClick }) => {
  if (!quote) return null;
  return (
    <section className="mb-8">
      <div
        className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-white/50 text-center cursor-pointer select-none relative overflow-hidden hover:shadow-2xl transition-all duration-300 group"
        onClick={onClick}
      >
        {/* Decorative blur elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl -z-10 group-hover:scale-110 transition-transform duration-500"></div>

        <p className="text-2xl italic text-gray-700 font-medium">
          "{quote.text}"
        </p>
        <p className="mt-4 font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-lg">
          - {quote.author}
        </p>
      </div>
    </section>
  );
};

// Records Section Component - Shows last 7 days task history
const RecordsSection = ({
  records,
  todayTasks = [],
  completedOneTimeTasks = [],
  skippedTasks = [],
}) => {
  const [manualCleanupRunning, setManualCleanupRunning] = useState(false);

  const handleManualCleanup = async () => {
    if (
      !confirm(
        "This will delete ALL historical records and start fresh. Continue?"
      )
    ) {
      return;
    }

    setManualCleanupRunning(true);
    console.log("🔴 MANUAL CLEANUP INITIATED");

    try {
      // Clear localStorage
      localStorage.removeItem("recordsCleanupV2Done");
      localStorage.removeItem("recordsCleanupV3Done");
      localStorage.setItem("dailyTaskRecords", "[]");

      // Delete from Supabase
      const recordsToDelete = records || [];
      console.log(`Deleting ${recordsToDelete.length} records from cloud...`);

      for (const record of recordsToDelete) {
        try {
          await syncData.deleteDailyRecord(record.date);
          console.log(`✅ Deleted: ${record.date}`);
        } catch (err) {
          console.warn(`⚠️ Failed to delete: ${record.date}`, err);
        }
      }

      console.log("✅ Manual cleanup complete! Reloading page...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("❌ Manual cleanup failed:", error);
      alert("Cleanup failed. Check console for details.");
      setManualCleanupRunning(false);
    }
  };

  console.log("📊 RecordsSection Debug:", {
    recordsReceived: records,
    recordsCount: records?.length || 0,
    todayTasksCount: todayTasks.length,
    completedOneTimeCount: completedOneTimeTasks.length,
    skippedTasksCount: skippedTasks.length,
    recordsDetails: records?.map((r) => ({
      date: r.date,
      total: r.total,
      completed: r.completed,
      remaining: r.remaining,
    })),
  });

  // Create today's record dynamically
  const today = getDateString();

  // Get skipped task IDs for today
  const todayDateString = getDateString();
  const skippedTaskIdsToday = new Set(
    skippedTasks
      .filter((st) => st.skipDate === todayDateString)
      .map((st) => st.taskId)
  );

  console.log("📊 Today's calculation DETAILED:", {
    todayDate: today,
    allTodayTasks: todayTasks.length,
    skippedCount: skippedTaskIdsToday.size,
    skippedTaskIds: Array.from(skippedTaskIdsToday),
    tasksBeforeFilter: todayTasks.map((t) => ({
      id: t.id,
      text: t.text.substring(0, 20),
      completed: t.completed,
    })),
  });

  // Filter tasks that should show today (excluding skipped tasks)
  const todayVisibleTasks = todayTasks.filter(
    (task) => shouldShowTaskToday(task) && !skippedTaskIdsToday.has(task.id)
  );
  const todayCompletedRecurring = todayVisibleTasks.filter(
    (t) => t.completed
  ).length;
  const todayTotal = todayVisibleTasks.length + completedOneTimeTasks.length;
  const todayCompleted = todayCompletedRecurring + completedOneTimeTasks.length;
  const todayRemaining = Math.max(0, todayTotal - todayCompleted);
  const todayProgress =
    todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

  const todayRecord = {
    date: today,
    completed: todayCompleted,
    remaining: todayRemaining,
    total: todayTotal,
    progress: todayProgress,
    isLive: true, // Flag to indicate this is live data
  };

  console.log("📊 Today's Record (live):", todayRecord);
  console.log("📊 Task counts:", {
    allTodayTasks: todayTasks.length,
    visibleTodayTasks: todayVisibleTasks.length,
    completedOneTime: completedOneTimeTasks.length,
    calculatedTotal: todayTotal,
  });

  // Combine today's record with historical records
  const allRecords = [todayRecord, ...(records || [])];

  // Remove duplicate if today's date already exists in historical records
  const uniqueRecords = allRecords.filter(
    (record, index, self) =>
      index === self.findIndex((r) => r.date === record.date)
  );

  // Sort records by date (newest first) and take last 7
  const sortedRecords = uniqueRecords
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7);

  // TEMP FIX: If cleanup hasn't run, only show today's record
  const cleanupDone = localStorage.getItem("recordsCleanupV3Done");
  const displayRecords = cleanupDone ? sortedRecords : [todayRecord];

  console.log("📊 Final sorted records:", sortedRecords);
  console.log("📊 Display records (after cleanup filter):", displayRecords);
  console.log("📊 Cleanup status:", {
    cleanupDone,
    showingOnlyToday: !cleanupDone,
  });

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === getDateString()) return "Today";
    if (dateString === getDateString(yesterday)) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="mb-8">
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-3xl p-6 sm:p-8 shadow-xl border border-white/50 backdrop-blur-sm overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl -z-0" />

        {/* Header */}
        <div className="relative z-10 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <CalendarIcon className="w-8 h-8 text-indigo-600" />
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-blue-900 bg-clip-text text-transparent">
              Last 7 Days Records
            </h2>
          </div>
          <p className="text-sm text-gray-600 ml-11">
            Track your daily progress and consistency
          </p>

          {/* Info banner about historical records cleanup */}
          {!localStorage.getItem("recordsCleanupV3Done") && (
            <div className="mt-4 ml-11 p-4 bg-red-50 border-2 border-red-300 rounded-lg text-sm">
              <div className="font-bold text-red-800 mb-2">
                🔴 ATTENTION: Data Cleanup Required (V3)
              </div>
              <div className="text-red-700 space-y-2">
                <p>
                  <strong>
                    Historical records contain incorrect counts (weekly tasks on
                    wrong days).
                  </strong>
                </p>
                <p>Currently showing ONLY today's live record. To fix:</p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Refresh the page - cleanup will run automatically</li>
                  <li>Or click the button below to force cleanup now</li>
                </ol>
                <button
                  onClick={handleManualCleanup}
                  disabled={manualCleanupRunning}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-lg transition-colors"
                >
                  {manualCleanupRunning
                    ? "🔄 Cleaning up..."
                    : "🗑️ Clean Up Records Now"}
                </button>
                <p className="mt-2 text-xs">
                  After cleanup, historical records will rebuild with correct
                  counts day by day.
                </p>
              </div>
            </div>
          )}

          {localStorage.getItem("recordsCleanupV3Done") && (
            <div className="mt-4 ml-11 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">✅ Cleanup Complete:</span>{" "}
                  All records now exclude skipped tasks correctly. Historical
                  records will rebuild accurately over the next 7 days.
                </div>
                <button
                  onClick={handleManualCleanup}
                  disabled={manualCleanupRunning}
                  className="ml-4 px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                >
                  {manualCleanupRunning
                    ? "🔄 Cleaning..."
                    : "🗑️ Re-clean Records"}
                </button>
              </div>
              <p className="text-xs mt-2">
                If you still see incorrect totals in old records, click
                "Re-clean Records" to delete them.
              </p>
            </div>
          )}
        </div>

        {/* Records Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayRecords.length === 0 ? (
            <div className="col-span-full bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center shadow-md border-2 border-gray-200/50">
              <div className="flex flex-col items-center gap-3">
                <div className="text-6xl">📊</div>
                <h3 className="text-xl font-bold text-gray-700">
                  Getting Started
                </h3>
                <p className="text-sm text-gray-600 max-w-md">
                  Add some tasks and start completing them! Your progress will
                  appear here automatically.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Check the browser console (F12) for debugging information
                </p>
              </div>
            </div>
          ) : (
            displayRecords.map((record) => {
              const progress = Math.round(record.progress || 0);
              const isToday = record.date === getDateString();

              return (
                <div
                  key={record.date}
                  className={`bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-md hover:shadow-lg transition-all duration-300 border-2 ${
                    isToday
                      ? "border-indigo-300 ring-2 ring-indigo-100"
                      : "border-gray-200/50 hover:border-indigo-200"
                  }`}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-sm font-bold ${
                        isToday ? "text-indigo-600" : "text-gray-700"
                      }`}
                    >
                      {getDayName(record.date)}
                    </span>
                    {isToday && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Task Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Completed:</span>
                      <span className="text-sm font-bold text-green-600">
                        {record.completed}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Remaining:</span>
                      <span className="text-sm font-bold text-orange-600">
                        {record.remaining}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Total:</span>
                      <span className="text-sm font-bold text-gray-700">
                        {record.total}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Progress</span>
                      <span className="text-sm font-bold text-indigo-600">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          progress === 100
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : progress >= 75
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                            : progress >= 50
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                            : "bg-gradient-to-r from-orange-500 to-red-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Achievement Badge */}
                  {progress === 100 && (
                    <div className="mt-3 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-md">
                        <span>🎉</span> Perfect Day!
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Summary Stats */}
        {displayRecords.length > 0 && (
          <div className="relative z-10 mt-6 pt-6 border-t border-gray-200/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold text-indigo-600">
                  {displayRecords.filter((r) => r.progress === 100).length}
                </div>
                <div className="text-xs text-gray-600">Perfect Days</div>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(
                    displayRecords.reduce((sum, r) => sum + r.completed, 0) /
                      displayRecords.length
                  )}
                </div>
                <div className="text-xs text-gray-600">Avg Completed</div>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(
                    displayRecords.reduce((sum, r) => sum + r.progress, 0) /
                      displayRecords.length
                  )}
                  %
                </div>
                <div className="text-xs text-gray-600">Avg Progress</div>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold text-purple-600">
                  {displayRecords.reduce((sum, r) => sum + r.completed, 0)}
                </div>
                <div className="text-xs text-gray-600">Total Done</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

function ProfileMenu({
  onImport,
  onExport,
  onOpenStats,
  isSyncing,
  lastSyncTime,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const userName = localStorage.getItem("userName") || "User";
  const userId = localStorage.getItem("userId") || "";

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const copyUserId = () => {
    navigator.clipboard.writeText(userId);
    alert("User ID copied to clipboard!");
  };

  return (
    <div className="relative flex flex-col items-center ml-4">
      <button
        ref={buttonRef}
        className="p-0 border-none bg-transparent hover:bg-transparent focus:outline-none"
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
        style={{ boxShadow: "none" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-user"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>
      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 z-50 p-2 text-left flex flex-col"
        >
          <div className="p-3 bg-gray-50 rounded-lg mb-2">
            <div className="font-semibold text-gray-900 text-base mb-1">
              {userName}
            </div>
            <div className="text-xs text-gray-500 mb-2">
              User ID: {userId.substring(0, 8)}...
              <button
                onClick={copyUserId}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                Copy
              </button>
            </div>
            <SyncStatusIndicator
              isSyncing={isSyncing}
              lastSyncTime={lastSyncTime}
            />
          </div>
          <div className="border-t border-gray-100 my-1"></div>
          <button
            onClick={() => {
              onOpenStats();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
          >
            Statistics
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button
            onClick={() => {
              onImport();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
          >
            Import Data
          </button>
          <button
            onClick={() => {
              onExport();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
          >
            Export Data
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to logout?")) {
                handleLogout();
              }
            }}
            className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium"
          >
            Logout
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <div className="bg-white p-4 rounded-2xl">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Follow on</h3>
            <div className="flex justify-center space-x-4">
              <a
                href="https://www.linkedin.com/in/md-rabbi-hossen-rabbi-b1bbb0326/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/mohammad.rahat.177570"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://github.com/md-rabbihossen"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-800 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="mailto:rabbihossenrabbi24@gmail.com"
                className="text-red-500 hover:text-red-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M0 3v18h24V3H0zm21.518 2L12 12.713 2.482 5h19.036zM2 19V7.183l10 8.104 10-8.104V19H2z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-auto text-center text-gray-600 font-semibold text-sm p-2">
            <p>
              © 2025 Progress Tracker. All rights reserved. Made by Md Rahat
              Hossen
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- New Add/Edit Book Modal Component ---
function AddEditBookModal({ isOpen, onClose, onSave, editingBook }) {
  const [name, setName] = useState("");
  const [pages, setPages] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editingBook) {
        setName(editingBook.name);
        setPages(editingBook.totalPages);
      } else {
        setName("");
        setPages("");
      }
    }
  }, [isOpen, editingBook]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && pages && !isNaN(pages) && Number(pages) > 0) {
      onSave({
        name: name.trim(),
        totalPages: Number(pages),
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBook ? "Edit Book" : "Add Book"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Book Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Pages
          </label>
          <input
            type="number"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
            min="1"
            required
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {editingBook ? "Save Changes" : "Add Book"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Helper function to compare data freshness and completeness
// Returns true if cloudData should be used, false if localStorage is better
const shouldUseCloudData = (cloudData, localData, dataType) => {
  // If no cloud data, use local
  if (!cloudData || (Array.isArray(cloudData) && cloudData.length === 0)) {
    console.log(`📊 ${dataType}: No cloud data, using localStorage`);
    return false;
  }

  // If no local data, use cloud
  if (!localData || (Array.isArray(localData) && localData.length === 0)) {
    console.log(`📊 ${dataType}: No local data, using cloud`);
    return true;
  }

  // Both have data - compare completeness
  const cloudSize = Array.isArray(cloudData)
    ? cloudData.length
    : cloudData
    ? Object.keys(cloudData).length
    : 0;
  const localSize = Array.isArray(localData)
    ? localData.length
    : localData
    ? Object.keys(localData).length
    : 0;

  // If cloud has significantly more data (20% or more), prefer cloud
  if (cloudSize >= localSize * 1.2) {
    console.log(
      `📊 ${dataType}: Cloud has more data (${cloudSize} vs ${localSize}), using cloud`
    );
    return true;
  }

  // If local has significantly more data, prefer local and sync it
  if (localSize >= cloudSize * 1.2) {
    console.log(
      `📊 ${dataType}: Local has more data (${localSize} vs ${cloudSize}), using local`
    );
    return false;
  }

  // Similar size - prefer cloud as source of truth
  console.log(
    `📊 ${dataType}: Similar sizes (cloud: ${cloudSize}, local: ${localSize}), using cloud`
  );
  return true;
};

// Helper function to filter completedOneTimeTasks to only include today's tasks
const filterTodayCompletedTasks = (completedOneTimeTasks) => {
  const todayDateString = new Date().toDateString();
  return (completedOneTimeTasks || []).filter((task) => {
    if (task.completedAt) {
      const completedDate = new Date(task.completedAt).toDateString();
      return completedDate === todayDateString;
    }
    return false;
  });
};

// Main App Component
export default function App() {
  // Supabase sync hook - NOW WITH REAL-TIME SYNC! 🚀
  const {
    userId,
    setUserId,
    isSyncing,
    lastSyncTime,
    syncRoadmap,
    syncTodayTasks,
    syncBooks,
    syncPomodoroStats,
    syncGoals,
    syncAppSettings,
    loadInitialData,
    setupRealtimeSubscriptions,
  } = useSupabaseSync();

  // Refs for various purposes
  const isUserAddingDataRef = useRef(false);
  const syncTimeoutRef = useRef(null);
  const resetJustPerformedRef = useRef(false);
  const justLoadedFromCloudRef = useRef(false); // NEW: Prevent immediate sync after loading
  const dataLoadTimestampRef = useRef(0); // NEW: Track when data was loaded

  // State for bottom navigation
  const [activeSection, setActiveSection] = useState("home");
  const [roadmap, setRoadmap] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [todayDailyTasks, setTodayDailyTasks] = useState([]);
  const [completedOneTimeTasks, setCompletedOneTimeTasks] = useState([]);
  const [skippedTasks, setSkippedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("skippedTasks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [books, setBooks] = useState(getInitialBooks());
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayProgress, setTodayProgress] = useState({
    hoursCompleted: 0,
    pagesRead: 0,
  });

  const [masterAddTimeModalOpen, setMasterAddTimeModalOpen] = useState(false);
  const [spanningTaskModalOpen, setSpanningTaskModalOpen] = useState(false);
  const [addWeeksModalOpen, setAddWeeksModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);

  // Drag and drop state for Track page
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [newWeeklyTaskModal, setNewWeeklyTaskModal] = useState({
    isOpen: false,
    weekNumber: null,
  });

  const [quoteIndex, setQuoteIndex] = useState(() => {
    const saved = localStorage.getItem("quoteIndex");
    return saved ? parseInt(saved, 10) : 0;
  });

  // State for daily task records (last 7 days)
  const [dailyRecords, setDailyRecords] = useState(() => {
    try {
      const saved = localStorage.getItem("dailyTaskRecords");
      const records = saved ? JSON.parse(saved) : [];
      console.log("📊 Initialized dailyRecords from localStorage:", {
        count: records.length,
        records: records,
      });
      return records;
    } catch (error) {
      console.error("❌ Failed to load dailyRecords from localStorage:", error);
      return [];
    }
  });

  // Enhanced features state
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortType, setSortType] = useState("priority");
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem("userGoals");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false);
  const [showPomodoroTimer, setShowPomodoroTimer] = useState(false);

  // Persistent Pomodoro timer state
  const [pomodoroState, setPomodoroState] = useState({
    isRunning: false,
    timeLeft: 30 * 60, // 30 minutes in seconds (updated default)
    currentState: "work", // 'work', 'shortBreak', 'longBreak'
    totalTime: 30 * 60,
    selectedLabel: "programming", // Default category
  });

  // Pomodoro timer interval ref
  const pomodoroIntervalRef = useRef(null);
  // Audio ref for timer completion sound
  const timerAudioRef = useRef(null);
  // Ref to track if timer completion has been processed
  const timerCompletedRef = useRef(false);

  // Run Pomodoro timer independently of modal
  useEffect(() => {
    if (pomodoroState.isRunning && pomodoroState.timeLeft > 0) {
      pomodoroIntervalRef.current = setInterval(() => {
        setPomodoroState((prev) => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
    } else {
      if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current);
        pomodoroIntervalRef.current = null;
      }
    }

    return () => {
      if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current);
      }
    };
  }, [pomodoroState.isRunning, pomodoroState.timeLeft]);

  // Handle timer completion
  useEffect(() => {
    if (
      pomodoroState.timeLeft === 0 &&
      pomodoroState.isRunning &&
      !timerCompletedRef.current
    ) {
      // Mark as completed to prevent multiple processing
      timerCompletedRef.current = true;

      // Timer completed, stop it
      setPomodoroState((prev) => ({
        ...prev,
        isRunning: false,
      }));

      // Add completed session time to statistics
      const completedMinutes = Math.floor(pomodoroState.totalTime / 60);
      if (completedMinutes > 0) {
        // Use the selected label from timer state, fallback to "study" if not available
        const category = pomodoroState.selectedLabel || "study";
        addPomodoroTime(completedMinutes, category);
      }

      // Play timer completion sound
      if (timerAudioRef.current) {
        timerAudioRef.current.play().catch((error) => {
          console.log("Could not play timer sound:", error);
        });
      }

      // Show notification or toast
      if (window.showToast && typeof window.showToast === "function") {
        const completedMinutes = Math.floor(pomodoroState.totalTime / 60);
        window.showToast(
          `🍅 ${
            pomodoroState.currentState === "work" ? "Focus session" : "Break"
          } completed! ${completedMinutes} minutes tracked`,
          "pomodoro"
        );
      }
    }

    // Reset the completion flag when timer is running (new session started)
    if (pomodoroState.isRunning && pomodoroState.timeLeft > 0) {
      timerCompletedRef.current = false;
    }
  }, [
    pomodoroState.timeLeft,
    pomodoroState.isRunning,
    pomodoroState.currentState,
    pomodoroState.totalTime,
    pomodoroState.selectedLabel,
  ]);

  // Pomodoro timer state management
  const handlePomodoroStateChange = (timerState) => {
    console.log("🔄 App received timer state change:", timerState);
    // Update persistent timer state
    setPomodoroState(timerState);
  };

  const handlePomodoroModalClose = () => {
    // Just close the modal, don't set minimized since blue icon is hidden
    setShowPomodoroTimer(false);
    // Keep the timer running in background if it was running
  };

  const handlePomodoroIconClick = () => {
    // Always just open the modal
    setShowPomodoroTimer(true);
  };

  const handleNavigationClick = (targetSection) => {
    setShowPomodoroTimer(false);
    setActiveSection(targetSection);
  };

  const handleNextQuote = () => {
    setQuoteIndex((prev) => {
      const next = (prev + 1) % quotes.length;
      localStorage.setItem("quoteIndex", next);
      return next;
    });
  };

  // Helper function to update todayDailyTasks with localStorage support
  const updateTodayDailyTasks = (updatedTasks) => {
    setTodayDailyTasks(updatedTasks);
    // Always save to localStorage for localStorage-only app
    localStorage.setItem("todayDailyTasks", JSON.stringify(updatedTasks));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      if (userId) {
        // User is logged in - try to load from Supabase, fallback to localStorage
        console.log("👤 User logged in, loading data...");
        try {
          // Try to load from cloud with timeout
          const cloudDataPromise = loadInitialData();
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => resolve(null), 3000)
          );

          const cloudData = await Promise.race([
            cloudDataPromise,
            timeoutPromise,
          ]);

          if (cloudData) {
            console.log("☁️ Cloud data loaded successfully");
            console.log("📦 Cloud data structure:", {
              hasRoadmap: !!cloudData.roadmap,
              hasTodayTasks: !!cloudData.todayTasks,
              todayTasksStructure: cloudData.todayTasks,
              hasBooks: !!cloudData.books,
              hasGoals: !!cloudData.goals,
              goalsCount: cloudData.goals?.length || 0,
              hasPomodoroStats: !!cloudData.pomodoroStats,
              dailyProgressCount: cloudData.dailyProgress?.length || 0,
            });

            let hasAnyCloudData = false;

            // Load roadmap from cloud or localStorage
            if (cloudData.roadmap) {
              console.log("✅ Setting roadmap from cloud");
              setRoadmap(cloudData.roadmap);
              localStorage.setItem(
                "roadmap",
                JSON.stringify(cloudData.roadmap)
              );
              hasAnyCloudData = true;
            } else {
              console.log(
                "⚠️ No roadmap in cloud, will use localStorage fallback"
              );
            }

            // Load tasks from cloud or localStorage
            if (cloudData.todayTasks) {
              const { tasks, completedOneTimeTasks, lastResetDate } =
                cloudData.todayTasks;
              const today = getDateString();

              console.log("✅ Tasks loaded from cloud:", {
                tasks: tasks?.length || 0,
                completedOneTime: completedOneTimeTasks?.length || 0,
                lastResetDate,
                today,
                needsReset: lastResetDate !== today,
              });

              // Check if tasks need to be reset (if last reset was not today)
              if (lastResetDate && lastResetDate !== today) {
                console.log(
                  "🔄 Cloud tasks are from previous day, applying reset logic..."
                );

                // Try to get yesterday's skipped tasks from temporary storage
                let yesterdaySkippedTaskIds = new Set();

                try {
                  const savedYesterdaySkips = localStorage.getItem(
                    "yesterdaySkippedTasks"
                  );
                  if (savedYesterdaySkips) {
                    const yesterdaySkips = JSON.parse(savedYesterdaySkips);
                    yesterdaySkippedTaskIds = new Set(
                      yesterdaySkips
                        .filter((st) => st.skipDate === lastResetDate)
                        .map((st) => st.taskId)
                    );
                    console.log(
                      "📥 Cloud sync - Loaded yesterday's skipped tasks:",
                      yesterdaySkippedTaskIds.size
                    );
                  }
                } catch (err) {
                  console.warn(
                    "⚠️ Cloud sync - Failed to load yesterday's skipped tasks:",
                    err
                  );
                }

                // Filter tasks that were actually visible yesterday (scheduled for that day + not skipped)
                const yesterdayVisibleTasks = tasks.filter((task) => {
                  // Exclude skipped tasks
                  if (yesterdaySkippedTaskIds.has(task.id)) return false;

                  // Include one-time tasks
                  if (!task.isDaily) return true;

                  // For recurring tasks, check if they were scheduled for yesterday
                  if (task.repeatType === "daily") return true;

                  if (
                    task.repeatType === "custom" &&
                    task.selectedDays?.length > 0
                  ) {
                    // Get yesterday's day index (0=Sun, 1=Mon, ..., 6=Sat)
                    const yesterdayDate = new Date(lastResetDate);
                    const yesterdayDayIndex = yesterdayDate.getDay();
                    return task.selectedDays.includes(yesterdayDayIndex);
                  }

                  return false;
                });

                // Save yesterday's record before resetting
                const completedRecurringCount = yesterdayVisibleTasks.filter(
                  (t) => t.completed
                ).length;
                const totalTasks =
                  yesterdayVisibleTasks.length +
                  (completedOneTimeTasks?.length || 0);
                const completedTotal =
                  completedRecurringCount +
                  (completedOneTimeTasks?.length || 0);
                const remainingTasks = Math.max(0, totalTasks - completedTotal);
                const progressPercentage =
                  totalTasks > 0 ? (completedTotal / totalTasks) * 100 : 0;

                const yesterdayRecord = {
                  date: lastResetDate,
                  completed: completedTotal,
                  remaining: remainingTasks,
                  total: totalTasks,
                  progress: progressPercentage,
                };

                console.log(
                  "💾 Saving yesterday's record during cloud sync:",
                  yesterdayRecord
                );
                console.log("📊 Cloud sync - Yesterday's record calculation:", {
                  allTasks: tasks.length,
                  skippedTasks: yesterdaySkippedTaskIds.size,
                  visibleTasks: yesterdayVisibleTasks.length,
                  completedRecurring: completedRecurringCount,
                  completedOneTime: completedOneTimeTasks?.length || 0,
                  total: totalTasks,
                  yesterdayDate: lastResetDate,
                });

                // Save to Supabase
                try {
                  await syncData.saveDailyRecord(
                    lastResetDate,
                    yesterdayRecord.completed,
                    yesterdayRecord.remaining,
                    yesterdayRecord.total,
                    yesterdayRecord.progress
                  );
                  console.log(
                    "✅ Yesterday's record synced to cloud during reset"
                  );
                } catch (err) {
                  console.error("❌ Failed to sync yesterday's record:", err);
                }

                // Keep uncompleted tasks
                const uncompletedTasks = tasks.filter((t) => !t.completed);

                // Reset daily and recurring tasks that were completed
                const completedRecurringTasks = tasks
                  .filter(
                    (t) =>
                      t.completed &&
                      (t.isDaily ||
                        t.repeatType === "daily" ||
                        shouldShowTaskToday(t))
                  )
                  .map((t) => ({ ...t, completed: false }));

                const resetTasks = [
                  ...uncompletedTasks,
                  ...completedRecurringTasks,
                ];

                console.log("📊 Reset applied:", {
                  uncompleted: uncompletedTasks.length,
                  resetRecurring: completedRecurringTasks.length,
                  total: resetTasks.length,
                });

                // Set reset tasks
                setTodayTasks(resetTasks);
                setCompletedOneTimeTasks([]);

                // Save to localStorage
                localStorage.setItem("todayTasks", JSON.stringify(resetTasks));
                localStorage.setItem(
                  "completedOneTimeTasks",
                  JSON.stringify([])
                );
                localStorage.setItem("todayTasksLastReset", today);

                // Sync reset tasks back to cloud immediately
                console.log("☁️ Syncing reset tasks back to cloud...");
                syncData.saveTodayTasks(resetTasks, [], today).catch((err) => {
                  console.error("❌ Failed to sync reset tasks:", err);
                });

                hasAnyCloudData = true;
              } else {
                // Tasks are already reset for today, just load them
                // But filter completedOneTimeTasks to only include tasks completed today
                const validCompletedTasks = filterTodayCompletedTasks(
                  completedOneTimeTasks
                );

                // Also clean todayTasks of any completed one-time tasks
                const cleanedTasks = (tasks || []).filter((task) => {
                  if (task.completed && task.repeatType === "none") {
                    console.warn(
                      "🔧 Removing completed one-time task from cloud data:",
                      task.text
                    );
                    return false;
                  }
                  return true;
                });

                console.log("✅ Filtered cloud data:", {
                  originalCompletedOneTime: completedOneTimeTasks?.length || 0,
                  validCompletedOneTime: validCompletedTasks.length,
                  originalTasks: tasks?.length || 0,
                  cleanedTasks: cleanedTasks.length,
                });

                setTodayTasks(cleanedTasks);
                setCompletedOneTimeTasks(validCompletedTasks);
                localStorage.setItem(
                  "todayTasks",
                  JSON.stringify(cleanedTasks)
                );
                localStorage.setItem(
                  "completedOneTimeTasks",
                  JSON.stringify(validCompletedTasks)
                );
                if (lastResetDate) {
                  localStorage.setItem("todayTasksLastReset", lastResetDate);
                }
                hasAnyCloudData = true;
              }
            }

            // Load books from cloud or localStorage
            if (cloudData.books) {
              setBooks(cloudData.books);
              localStorage.setItem("books", JSON.stringify(cloudData.books));
              hasAnyCloudData = true;
            }

            // Load todayDailyTasks (Track page progress tasks) with smart comparison
            const localDailyTasksStr = localStorage.getItem("todayDailyTasks");
            const localDailyTasks = localDailyTasksStr
              ? JSON.parse(localDailyTasksStr)
              : [];

            const useCloud = shouldUseCloudData(
              cloudData.todayDailyTasks,
              localDailyTasks,
              "Track Tasks"
            );

            if (
              useCloud &&
              cloudData.todayDailyTasks &&
              cloudData.todayDailyTasks.length > 0
            ) {
              console.log(
                "✅ Loading",
                cloudData.todayDailyTasks.length,
                "daily tasks from cloud"
              );
              setTodayDailyTasks(cloudData.todayDailyTasks);
              localStorage.setItem(
                "todayDailyTasks",
                JSON.stringify(cloudData.todayDailyTasks)
              );
              hasAnyCloudData = true;
            } else if (localDailyTasks && localDailyTasks.length > 0) {
              // Use local data and sync to cloud
              console.log(
                "✅ Loading",
                localDailyTasks.length,
                "daily tasks from localStorage (more complete)"
              );
              setTodayDailyTasks(localDailyTasks);
              // Sync to cloud immediately
              console.log("☁️ Syncing localStorage tasks to cloud...");
              syncData.saveTodayDailyTasks(localDailyTasks).catch((err) => {
                console.error("❌ Failed to sync daily tasks to cloud:", err);
              });
            }

            // Load pomodoro stats from cloud or localStorage with smart comparison
            const localPomodoroStats = localStorage.getItem("pomodoroStats");
            const localStats = localPomodoroStats
              ? JSON.parse(localPomodoroStats)
              : null;

            if (cloudData.pomodoroStats || localStats) {
              // Compare cloud vs local data
              const cloudStats = cloudData.pomodoroStats;
              const useCloud = shouldUseCloudData(
                cloudStats?.lifetime?.totalMinutes,
                localStats?.lifetime?.totalMinutes,
                "Pomodoro Stats"
              );

              if (useCloud && cloudStats) {
                console.log("✅ Loading pomodoro stats from cloud");
                localStorage.setItem(
                  "pomodoroStats",
                  JSON.stringify(cloudStats)
                );
                hasAnyCloudData = true;
              } else if (localStats) {
                console.log("✅ Using local pomodoro stats (more complete)");
                // Sync local data to cloud
                console.log("☁️ Syncing local pomodoro stats to cloud...");
                syncData.savePomodoroStats(localStats).catch((err) => {
                  console.error("❌ Failed to sync pomodoro stats:", err);
                });
              }
            }

            // Load app settings from cloud or localStorage
            if (cloudData.appSettings) {
              console.log("✅ Loading app settings from cloud");
              localStorage.setItem(
                "appSettings",
                JSON.stringify(cloudData.appSettings)
              );
              hasAnyCloudData = true;
            }

            // Load daily progress entries from cloud
            if (cloudData.dailyProgress && cloudData.dailyProgress.length > 0) {
              console.log(
                `✅ Loading ${cloudData.dailyProgress.length} daily progress entries from cloud`
              );
              cloudData.dailyProgress.forEach((entry) => {
                localStorage.setItem(
                  `dailyProgress_${entry.date}`,
                  JSON.stringify(entry.progress_data)
                );
              });
              hasAnyCloudData = true;
            }

            // Load user goals from cloud with smart comparison
            const localGoalsStr = localStorage.getItem("userGoals");
            const localGoals = localGoalsStr ? JSON.parse(localGoalsStr) : [];

            const useCloudGoals = shouldUseCloudData(
              cloudData.goals,
              localGoals,
              "Goals"
            );

            if (useCloudGoals && cloudData.goals) {
              console.log(
                `✅ Loading ${cloudData.goals.length} goals from cloud`
              );
              setGoals(cloudData.goals);
              localStorage.setItem(
                "userGoals",
                JSON.stringify(cloudData.goals)
              );
              hasAnyCloudData = true;
            } else if (localGoals && localGoals.length > 0) {
              console.log(
                `✅ Using ${localGoals.length} goals from localStorage (more complete)`
              );
              setGoals(localGoals);
              // Sync to cloud
              console.log("☁️ Syncing local goals to cloud...");
              syncData.saveUserGoals(localGoals).catch((err) => {
                console.error("❌ Failed to sync goals:", err);
              });
            }

            // Set up real-time subscriptions for cross-device sync
            console.log("🔄 Setting up real-time subscriptions...");
            setupRealtimeSubscriptions({
              onRoadmapUpdate: (newRoadmap) => {
                console.log("🔄 Roadmap updated from another device!");
                setRoadmap(newRoadmap);
                localStorage.setItem("roadmap", JSON.stringify(newRoadmap));
              },
              onTasksUpdate: (newData) => {
                console.log("🔄 Tasks updated from another device!", {
                  tasksCount: newData.tasks?.length || 0,
                  completedCount: newData.completedOneTimeTasks?.length || 0,
                  lastReset: newData.lastResetDate,
                });
                const today = getDateString();

                // Only update if it's today's data
                if (newData.lastResetDate === today) {
                  console.log("✅ Updating tasks from real-time sync");
                  setTodayTasks(newData.tasks || []);
                  setCompletedOneTimeTasks(newData.completedOneTimeTasks || []);

                  // Update localStorage
                  localStorage.setItem(
                    "todayTasks",
                    JSON.stringify(newData.tasks || [])
                  );
                  localStorage.setItem(
                    "completedOneTimeTasks",
                    JSON.stringify(newData.completedOneTimeTasks || [])
                  );
                  localStorage.setItem(
                    "todayTasksLastReset",
                    newData.lastResetDate
                  );
                } else {
                  console.log(
                    "⚠️ Ignoring old task data from cloud (not today's)"
                  );
                }
              },
              onBooksUpdate: (newBooks) => {
                console.log("🔄 Books updated from another device!");
                setBooks(newBooks || []);
                localStorage.setItem("books", JSON.stringify(newBooks || []));
              },
              onGoalsUpdate: (newGoals) => {
                console.log("🔄 Goals updated from another device!");
                setGoals(newGoals || []);
                localStorage.setItem(
                  "userGoals",
                  JSON.stringify(newGoals || [])
                );
              },
            });

            // Load daily records from cloud
            try {
              const cloudRecords = await syncData.getDailyRecords(30);
              if (cloudRecords && cloudRecords.length > 0) {
                console.log(
                  `✅ Loading ${cloudRecords.length} daily records from cloud`
                );

                // Check if we need to clear old records (before the fix was applied)
                const needsCleanup = !localStorage.getItem(
                  "recordsCleanupV2Done"
                );

                if (needsCleanup) {
                  console.log(
                    "⚠️ Cleanup flag not set - will clear these cloud records after load"
                  );
                  // Don't set the records yet - let cleanup handle it
                  // Store temporarily for cleanup to delete
                  window._oldRecordsToDelete = cloudRecords;
                } else {
                  // Cleanup already done, these are good records
                  setDailyRecords(cloudRecords);
                  localStorage.setItem(
                    "dailyTaskRecords",
                    JSON.stringify(cloudRecords)
                  );
                }
                hasAnyCloudData = true;
              }
            } catch (error) {
              console.error(
                "❌ Failed to load daily records from cloud:",
                error
              );
            }

            console.log("✅ Data loaded from Supabase");

            // Only skip localStorage loading if we got ANY data from cloud
            if (hasAnyCloudData) {
              console.log(
                "✅ Prioritizing Supabase data, skipping localStorage fallback"
              );

              // CRITICAL: Mark that we just loaded from cloud to prevent immediate sync
              justLoadedFromCloudRef.current = true;
              dataLoadTimestampRef.current = Date.now();
              console.log(
                "🔒 Blocking auto-save for 5 seconds to prevent overwriting cloud data"
              );

              // Unblock after 5 seconds
              setTimeout(() => {
                justLoadedFromCloudRef.current = false;
                console.log("🔓 Auto-save unblocked - safe to sync now");
              }, 5000);

              setLoading(false);
              return; // Exit early - don't call loadFromLocalStorage()
            } else {
              console.log("⚠️ No data in Supabase, loading from localStorage");
            }
          } else {
            console.log("⏱️ Cloud load timeout, using localStorage");
          }
        } catch (error) {
          console.error("❌ Error loading from Supabase:", error);
        }
      }

      // Only load from localStorage if we didn't get cloud data
      console.log("📂 Loading from localStorage (fallback)");
      loadFromLocalStorage();
      setLoading(false);
    };

    const loadFromLocalStorage = () => {
      let storedRoadmap = null;
      let storedTodayTasks = null;
      let storedCompletedOneTimeTasks = [];
      let storedTodayDailyTasks = null;
      let storedBooks = null;
      let storedQuoteIndex = null;

      try {
        const roadmapString = localStorage.getItem("roadmap");
        if (roadmapString && roadmapString !== "null") {
          storedRoadmap = JSON.parse(roadmapString);
        }
        const todayTasksString = localStorage.getItem("todayTasks");
        if (todayTasksString) {
          storedTodayTasks = JSON.parse(todayTasksString);
        }
        const completedOneTimeTasksString = localStorage.getItem(
          "completedOneTimeTasks"
        );
        if (completedOneTimeTasksString) {
          storedCompletedOneTimeTasks = JSON.parse(completedOneTimeTasksString);
        }
        const todayDailyTasksString = localStorage.getItem("todayDailyTasks");
        if (todayDailyTasksString) {
          storedTodayDailyTasks = JSON.parse(todayDailyTasksString);
        }
        const booksString = localStorage.getItem("books");
        if (booksString) {
          storedBooks = JSON.parse(booksString);
        }
        const quoteIndexString = localStorage.getItem("quoteIndex");
        if (quoteIndexString) {
          storedQuoteIndex = parseInt(quoteIndexString, 10);
        }
      } catch (error) {
        console.error("Failed to parse localStorage data:", error);
        storedRoadmap = null;
        storedTodayTasks = null;
        storedTodayDailyTasks = null;
        storedBooks = null;
        storedQuoteIndex = null;
      }

      if (storedRoadmap) {
        setRoadmap(storedRoadmap);
      } else {
        setRoadmap(null);
      }

      if (storedTodayTasks) {
        // Filter out any completed one-time tasks that shouldn't be in todayTasks
        const cleanedTasks = storedTodayTasks.filter((task) => {
          // If it's a completed one-time task, it should be in completedOneTimeTasks, not here
          if (task.completed && task.repeatType === "none") {
            console.warn(
              "🔧 Removing completed one-time task from todayTasks:",
              task.text
            );
            return false;
          }
          return true;
        });

        if (cleanedTasks.length !== storedTodayTasks.length) {
          // Update localStorage with cleaned data
          localStorage.setItem("todayTasks", JSON.stringify(cleanedTasks));
        }

        setTodayTasks(cleanedTasks);
      } else {
        setTodayTasks([]);
      }

      // Remove duplicates and old tasks from completedOneTimeTasks before setting
      const uniqueCompletedTasks = storedCompletedOneTimeTasks.filter(
        (task, index, self) => index === self.findIndex((t) => t.id === task.id)
      );

      const validCompletedTasks =
        filterTodayCompletedTasks(uniqueCompletedTasks);

      if (validCompletedTasks.length !== storedCompletedOneTimeTasks.length) {
        console.warn(
          "🔧 Removed",
          storedCompletedOneTimeTasks.length - validCompletedTasks.length,
          "duplicate or old tasks from completedOneTimeTasks"
        );
        // Update localStorage with cleaned data
        localStorage.setItem(
          "completedOneTimeTasks",
          JSON.stringify(validCompletedTasks)
        );
      }
      setCompletedOneTimeTasks(validCompletedTasks);

      if (storedTodayDailyTasks) {
        setTodayDailyTasks(storedTodayDailyTasks);
      } else {
        setTodayDailyTasks([]);
      }

      if (storedBooks) {
        setBooks(storedBooks);
      } else {
        setBooks(getInitialBooks());
      }

      if (storedQuoteIndex !== null) {
        setQuoteIndex(storedQuoteIndex);
      } else {
        setQuoteIndex(0);
      }

      // Load today's progress data
      setTodayProgress(getTodayProgress());

      console.log("✅ Data loaded from localStorage");
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only reload when user logs in/out

  // ONE-TIME CLEANUP: Clear historical records that were calculated incorrectly
  // This runs once to remove old records that included skipped tasks in their counts
  useEffect(() => {
    const cleanupFlag = localStorage.getItem("recordsCleanupV2Done"); // V2 - more aggressive

    if (!cleanupFlag && !loading) {
      console.log(
        "🧹 ONE-TIME CLEANUP V2: Aggressively clearing ALL old records"
      );

      // Get records from either state or temp storage
      const recordsToDelete = window._oldRecordsToDelete || dailyRecords || [];
      console.log("📊 Old records being cleared:", recordsToDelete.length);

      // Clear ALL records (including today - it will be recalculated live)
      const emptyRecords = [];

      setDailyRecords(emptyRecords);
      localStorage.setItem("dailyTaskRecords", JSON.stringify(emptyRecords));

      // Clear from Supabase if user is logged in
      if (userId && recordsToDelete.length > 0) {
        console.log(
          "☁️ Clearing",
          recordsToDelete.length,
          "records from cloud database"
        );

        // Delete ALL records for this user from cloud
        recordsToDelete.forEach((record, index) => {
          setTimeout(() => {
            syncData
              .deleteDailyRecord(record.date)
              .then(() => {
                console.log(
                  `✅ Deleted record ${index + 1}/${recordsToDelete.length}: ${
                    record.date
                  }`
                );
              })
              .catch((err) => {
                console.warn(
                  "⚠️ Failed to delete record from cloud:",
                  record.date,
                  err
                );
              });
          }, index * 100); // Stagger requests to avoid rate limits
        });
      }

      // Clean up temp storage
      delete window._oldRecordsToDelete;

      // Mark V2 cleanup as done
      localStorage.setItem("recordsCleanupV2Done", "true");
      localStorage.removeItem("recordsCleanupV1Done"); // Remove old flag
      console.log("✅ AGGRESSIVE cleanup completed - ALL records cleared!");
      console.log(
        "💡 Fresh records will be built from scratch with correct calculations"
      );
      console.log(
        "📅 Today's record will appear live, historical records will build day by day"
      );
    }
  }, [loading, dailyRecords, userId]);

  // V3 Cleanup: Fix records created before weekly task filtering was added
  // This removes records that incorrectly included weekly tasks on non-scheduled days
  useEffect(() => {
    const cleanupV3Flag = localStorage.getItem("recordsCleanupV3Done");

    if (!cleanupV3Flag && !loading && userId) {
      console.log(
        "🧹 ONE-TIME CLEANUP V3: Removing records with incorrect weekly task counts (day name vs day index bug)"
      );

      // Delete all existing records (they have wrong counts due to day name vs index mismatch)
      const recordsToDelete = dailyRecords || [];
      console.log("📊 Records to clear:", recordsToDelete.length);

      if (recordsToDelete.length > 0) {
        // Clear from localStorage
        setDailyRecords([]);
        localStorage.setItem("dailyTaskRecords", "[]");
        console.log("✅ Cleared localStorage records");

        // Clear from Supabase
        console.log(
          "☁️ Deleting",
          recordsToDelete.length,
          "records from Supabase..."
        );
        recordsToDelete.forEach((record, index) => {
          setTimeout(() => {
            syncData
              .deleteDailyRecord(record.date)
              .then(() => {
                console.log(
                  `✅ Deleted V3: ${record.date} (had total: ${record.total}, should match scheduled tasks for that day)`
                );
              })
              .catch((err) => {
                console.warn("⚠️ Failed to delete record:", record.date, err);
              });
          }, index * 150);
        });
      }

      // Mark V3 cleanup as done
      localStorage.setItem("recordsCleanupV3Done", "true");
      console.log(
        "✅ V3 Cleanup complete! New records will use day indices (0-6) instead of day names for filtering"
      );
    }
  }, [loading, dailyRecords, userId]);

  // Clean up old skipped tasks (remove skips from previous days)
  // BUT FIRST: Save yesterday's skipped task info before cleanup for the reset logic
  useEffect(() => {
    const today = getDateString();

    setSkippedTasks((prev) => {
      // IMPORTANT: Before cleaning up, save yesterday's skip data for the reset to use
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = getDateString(yesterday);

      const yesterdaySkips = prev.filter((st) => st.skipDate === yesterdayDate);
      if (yesterdaySkips.length > 0) {
        // Store yesterday's skips temporarily for the reset logic to access
        localStorage.setItem(
          "yesterdaySkippedTasks",
          JSON.stringify(yesterdaySkips)
        );
        console.log(
          "💾 Saved yesterday's skipped tasks for reset:",
          yesterdaySkips.length
        );
      }

      // Keep only skips from today
      // Remove skips from yesterday or earlier (different dates)
      const filtered = prev.filter((st) => st.skipDate === today);

      if (filtered.length !== prev.length) {
        const removed = prev.filter((st) => st.skipDate !== today);
        console.log(
          "🧹 Cleaned up",
          removed.length,
          "old skipped tasks:",
          removed.map((st) => ({
            task: st.taskData?.text,
            skipDate: st.skipDate,
            todayDate: today,
            repeatType: st.taskData?.repeatType,
            selectedDays: st.taskData?.selectedDays,
          }))
        );
      }
      return filtered;
    });

    // Run cleanup every minute to ensure tasks reappear on date change
    const intervalId = setInterval(() => {
      const currentDate = getDateString();

      setSkippedTasks((prev) => {
        const filtered = prev.filter((st) => st.skipDate === currentDate);

        if (filtered.length !== prev.length) {
          console.log(
            "🧹 Auto-cleanup at",
            new Date().toLocaleTimeString(),
            "- removed",
            prev.length - filtered.length,
            "old skips. Current date:",
            currentDate
          );
        }
        return filtered;
      });
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [activeSection]); // Run when section changes (daily check)

  // Refresh today's progress when analytics section is active or when progress is updated
  useEffect(() => {
    if (activeSection === "analytics") {
      setTodayProgress(getTodayProgress());
    }
  }, [activeSection]);

  // Listen to dailyProgressUpdate and sync to Supabase
  useEffect(() => {
    const handleProgressUpdate = (event) => {
      setTodayProgress(getTodayProgress());

      // Sync daily progress to Supabase
      if (userId && event.detail) {
        const { date, progress } = event.detail;
        console.log(
          `📊 Syncing daily progress for ${date} to cloud:`,
          progress
        );
        syncData.saveDailyProgress(date, progress).catch((err) => {
          console.error("❌ Failed to sync daily progress:", err);
        });
      }
    };

    window.addEventListener("dailyProgressUpdate", handleProgressUpdate);
    return () =>
      window.removeEventListener("dailyProgressUpdate", handleProgressUpdate);
  }, [userId]);

  // Update today's progress when analytics section becomes active
  useEffect(() => {
    if (activeSection === "analytics") {
      setTodayProgress(getTodayProgress());
    }
  }, [activeSection]);

  // Auto-save to localStorage AND Supabase when data changes 🚀
  useEffect(() => {
    if (loading) {
      console.log("⏸️ Auto-save skipped: loading =", loading);
      return;
    }
    if (!userId) {
      console.log("⏸️ Auto-save skipped: no userId");
      return;
    }

    // CRITICAL: Prevent auto-save immediately after loading from cloud
    if (justLoadedFromCloudRef.current) {
      const timeSinceLoad = Date.now() - dataLoadTimestampRef.current;
      console.log(
        `⏸️ Auto-save blocked: just loaded from cloud ${timeSinceLoad}ms ago`
      );
      return;
    }

    console.log("🔔 Auto-save triggered!", {
      userId: userId.substring(0, 8) + "...",
      roadmap: roadmap ? "exists" : "null",
      todayTasks: todayTasks?.length || 0,
      books: books?.length || 0,
      goals: goals?.length || 0,
    });

    // 1. Save to localStorage IMMEDIATELY (no debounce - instant backup)
    localStorage.setItem("roadmap", JSON.stringify(roadmap));
    localStorage.setItem("todayTasks", JSON.stringify(todayTasks));
    localStorage.setItem(
      "completedOneTimeTasks",
      JSON.stringify(completedOneTimeTasks)
    );
    localStorage.setItem("skippedTasks", JSON.stringify(skippedTasks));
    saveBooksToStorage(books);
    localStorage.setItem("todayDailyTasks", JSON.stringify(todayDailyTasks));
    localStorage.setItem("quoteIndex", quoteIndex.toString());
    localStorage.setItem("userGoals", JSON.stringify(goals));
    localStorage.setItem("dailyTaskRecords", JSON.stringify(dailyRecords));
    console.log("💾 Data auto-saved to localStorage");

    // 2. Debounce ONLY cloud sync to prevent too many API calls
    const timeoutId = setTimeout(async () => {
      try {
        console.log("⏰ Debounce timer expired, starting cloud sync...");

        // Sync to Supabase (cloud backup) 🌩️
        console.log("☁️ Starting Supabase sync...");
        const syncPromises = [];

        if (roadmap) {
          console.log("  📍 Adding roadmap to sync queue");
          syncPromises.push(syncData.saveRoadmap(roadmap));
        } else {
          console.log("  ⏭️ Skipping roadmap (null)");
        }

        if (todayTasks && todayTasks.length >= 0) {
          console.log("  ✅ Adding", todayTasks.length, "tasks to sync queue");
          const today = getDateString();
          const validCompletedTasks = filterTodayCompletedTasks(
            completedOneTimeTasks
          );

          syncPromises.push(
            syncData.saveTodayTasks(todayTasks, validCompletedTasks, today)
          );
        } else {
          console.log("  ⏭️ Skipping tasks (null)");
        }

        if (books && books.length >= 0) {
          console.log("  📚 Adding", books.length, "books to sync queue");
          syncPromises.push(syncData.saveBooks(books));
        } else {
          console.log("  ⏭️ Skipping books (null)");
        }

        if (goals && goals.length >= 0) {
          console.log("  🎯 Adding", goals.length, "goals to sync queue");
          syncPromises.push(syncData.saveUserGoals(goals));
        } else {
          console.log("  ⏭️ Skipping goals (null)");
        }

        // Sync pomodoro stats
        const pomodoroStatsString = localStorage.getItem("pomodoroStats");
        if (pomodoroStatsString) {
          const pomodoroStats = JSON.parse(pomodoroStatsString);
          console.log("  ⏱️ Adding pomodoro stats to sync queue");
          syncPromises.push(syncData.savePomodoroStats(pomodoroStats));
        } else {
          console.log(
            "  ⏭️ Skipping pomodoro stats (not found in localStorage)"
          );
        }

        // Sync todayDailyTasks (Track page progress tasks)
        if (todayDailyTasks && todayDailyTasks.length >= 0) {
          console.log(
            "  📈 Adding",
            todayDailyTasks.length,
            "daily tasks to sync queue"
          );
          syncPromises.push(syncData.saveTodayDailyTasks(todayDailyTasks));
        } else {
          console.log("  ⏭️ Skipping daily tasks (null)");
        }

        // Sync app settings (quote index, etc.)
        console.log("  ⚙️ Adding app settings to sync queue");
        syncPromises.push(syncData.saveAppSettings({ quoteIndex }));

        console.log(
          "🚀 Waiting for",
          syncPromises.length,
          "sync operations..."
        );
        // Wait for all syncs to complete
        await Promise.all(syncPromises);

        console.log("✨ All data synced to cloud successfully!");
      } catch (e) {
        console.error("💥 Failed to save/sync data:", e);
      }
    }, 1000); // Debounce to 1 second for faster cross-device sync

    return () => clearTimeout(timeoutId);
  }, [
    roadmap,
    todayTasks,
    completedOneTimeTasks,
    skippedTasks,
    todayDailyTasks,
    books,
    quoteIndex,
    goals,
    dailyRecords,
    loading,
    userId,
    // NOTE: Sync functions deliberately excluded to prevent infinite loops
  ]);

  // --- Daily Reset Logic for localStorage-only App ---
  useEffect(() => {
    // Skip if still loading data
    if (loading) {
      console.log("⏸️ Reset check skipped: still loading data");
      return;
    }

    let resetInProgress = false;

    const doLocalStorageResetIfNeeded = async () => {
      // Skip if reset already in progress
      if (resetInProgress) {
        console.log("⏸️ Reset check skipped: reset in progress");
        return;
      }

      // Skip if reset was already performed in this session
      if (resetJustPerformedRef.current) {
        console.log("⏸️ Reset already performed in this session, skipping.");
        return;
      }

      try {
        resetInProgress = true;
        const today = getDateString();
        const lastReset = localStorage.getItem("todayTasksLastReset") || "";

        console.log("📅 Reset check:", {
          today,
          lastReset,
          needsReset: lastReset !== today,
          currentTasksCount: todayTasks.length,
          resetJustPerformed: resetJustPerformedRef.current,
        });

        // Reset the flag if the date has actually changed
        if (lastReset !== today && resetJustPerformedRef.current) {
          console.log("📅 Date changed! Resetting the resetJustPerformed flag");
          resetJustPerformedRef.current = false;
        }

        if (lastReset !== today) {
          console.log("🔄 Starting daily reset...");
          console.log("📊 Before reset - todayTasks count:", todayTasks.length);
          console.log(
            "📊 Before reset - completedOneTimeTasks count:",
            completedOneTimeTasks.length
          );
          console.log("📊 todayTasks sample:", todayTasks.slice(0, 2));

          // Get current tasks snapshot
          const currentTasks = [...todayTasks];

          // Save yesterday's task record before resetting (only if lastReset exists)
          if (lastReset) {
            // Try to get yesterday's skipped tasks from temporary storage
            // (saved by the cleanup effect before it deleted them)
            let yesterdaySkippedTaskIds = new Set();

            try {
              const savedYesterdaySkips = localStorage.getItem(
                "yesterdaySkippedTasks"
              );
              if (savedYesterdaySkips) {
                const yesterdaySkips = JSON.parse(savedYesterdaySkips);
                yesterdaySkippedTaskIds = new Set(
                  yesterdaySkips
                    .filter((st) => st.skipDate === lastReset)
                    .map((st) => st.taskId)
                );
                console.log(
                  "📥 Loaded yesterday's skipped tasks from storage:",
                  yesterdaySkippedTaskIds.size
                );

                // Clean up the temporary storage after using it
                localStorage.removeItem("yesterdaySkippedTasks");
              } else {
                console.log("ℹ️ No yesterday skipped tasks found in storage");
              }
            } catch (err) {
              console.warn("⚠️ Failed to load yesterday's skipped tasks:", err);
            }

            // Filter tasks that were actually visible yesterday (scheduled for that day + not skipped)
            const yesterdayVisibleTasks = currentTasks.filter((task) => {
              // Exclude skipped tasks
              if (yesterdaySkippedTaskIds.has(task.id)) return false;

              // Include one-time tasks
              if (!task.isDaily) return true;

              // For recurring tasks, check if they were scheduled for yesterday
              if (task.repeatType === "daily") return true;

              if (
                task.repeatType === "custom" &&
                task.selectedDays?.length > 0
              ) {
                // Get yesterday's day index (0=Sun, 1=Mon, ..., 6=Sat)
                const yesterdayDate = new Date(lastReset);
                const yesterdayDayIndex = yesterdayDate.getDay();
                return task.selectedDays.includes(yesterdayDayIndex);
              }

              return false;
            });

            const completedRecurringTasks = yesterdayVisibleTasks.filter(
              (t) => t.completed
            ).length;
            const totalTasks =
              yesterdayVisibleTasks.length + completedOneTimeTasks.length;
            const remainingTasks = Math.max(
              0,
              totalTasks -
                (completedRecurringTasks + completedOneTimeTasks.length)
            );
            const progressPercentage =
              totalTasks > 0
                ? ((completedRecurringTasks + completedOneTimeTasks.length) /
                    totalTasks) *
                  100
                : 0;

            const yesterdayRecord = {
              date: lastReset,
              completed: completedRecurringTasks + completedOneTimeTasks.length,
              remaining: remainingTasks,
              total: totalTasks,
              progress: progressPercentage,
            };

            console.log("📊 Yesterday's record calculation:", {
              allTasks: currentTasks.length,
              skippedTasks: yesterdaySkippedTaskIds.size,
              visibleTasks: yesterdayVisibleTasks.length,
              completedRecurring: completedRecurringTasks,
              completedOneTime: completedOneTimeTasks.length,
              total: totalTasks,
              yesterdayDate: lastReset,
            });

            console.log("💾 Saving yesterday's record:", yesterdayRecord);

            // Get existing records and add the new one
            const existingRecords = dailyRecords || [];
            console.log("📚 Existing records count:", existingRecords.length);

            // Check if record for this date already exists
            const existingRecordIndex = existingRecords.findIndex(
              (r) => r.date === lastReset
            );
            let updatedRecords;

            if (existingRecordIndex >= 0) {
              // Update existing record
              updatedRecords = [...existingRecords];
              updatedRecords[existingRecordIndex] = yesterdayRecord;
              console.log("📝 Updated existing record for", lastReset);
            } else {
              // Add new record
              updatedRecords = [...existingRecords, yesterdayRecord];
              console.log("➕ Added new record for", lastReset);
            }

            // Keep only last 30 days (for storage efficiency)
            const last30Records = updatedRecords
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 30);

            console.log("💾 Total records after update:", last30Records.length);
            console.log("💾 Records to save:", last30Records);

            setDailyRecords(last30Records);
            localStorage.setItem(
              "dailyTaskRecords",
              JSON.stringify(last30Records)
            );
            console.log("✅ Record saved to state and localStorage");

            // Sync record to Supabase (make it synchronous to ensure it completes)
            console.log("🔍 Checking userId for Supabase sync:", {
              userId: userId ? userId.substring(0, 8) + "..." : "null",
              hasUserId: !!userId,
            });

            if (userId) {
              console.log("☁️ Syncing daily record to Supabase...");
              try {
                await syncData.saveDailyRecord(
                  lastReset,
                  yesterdayRecord.completed,
                  yesterdayRecord.remaining,
                  yesterdayRecord.total,
                  yesterdayRecord.progress
                );
                console.log("✅ Daily record synced to cloud");
              } catch (err) {
                console.error("❌ Failed to sync daily record:", err);
              }
            } else {
              console.warn(
                "⚠️ No userId, skipping Supabase sync for daily record"
              );
            }
          } else {
            console.log(
              "⏭️ No lastReset date, skipping record save (first run)"
            );
          }

          // Keep uncompleted tasks
          const uncompletedTasks = currentTasks.filter((t) => !t.completed);

          // Reset daily and recurring tasks that were completed
          const completedRecurringTasks = currentTasks
            .filter(
              (t) =>
                t.completed &&
                (t.isDaily ||
                  t.repeatType === "daily" ||
                  shouldShowTaskToday(t))
            )
            .map((t) => ({ ...t, completed: false }));

          const resetTasks = [...uncompletedTasks, ...completedRecurringTasks];

          console.log("📊 After reset:", {
            uncompletedTasks: uncompletedTasks.length,
            completedRecurringTasks: completedRecurringTasks.length,
            resetTasks: resetTasks.length,
          });

          // Reset daily progress
          saveTodayProgress(0, 0);

          // Reset daily analytics stats (but keep lifetime stats)
          resetDailyPomodoroStats();

          // Ensure weekly and monthly stats are properly initialized for new periods
          checkAndResetWeeklyStats();
          checkAndResetMonthlyStats();

          // Update state for today's tasks
          setTodayTasks(resetTasks);

          // Clear completed one-time tasks for the new day
          setCompletedOneTimeTasks([]);

          // Save to localStorage
          localStorage.setItem("todayTasks", JSON.stringify(resetTasks));
          localStorage.setItem("completedOneTimeTasks", JSON.stringify([]));
          localStorage.setItem("todayTasksLastReset", today);

          // Sync reset tasks to Supabase
          if (userId) {
            console.log("☁️ Syncing reset tasks to Supabase...");
            const todayDate = getDateString();
            syncData
              .saveTodayTasks(resetTasks, [], todayDate)
              .then(() => {
                console.log("✅ Reset tasks synced to cloud");
              })
              .catch((err) => {
                console.error("❌ Failed to sync reset tasks:", err);
              });
          }

          // Mark reset as performed for this session
          resetJustPerformedRef.current = true;
          console.log("✅ Daily reset completed");
        } else {
          console.log("✅ Tasks already reset for today, no action needed");
          // Mark reset as performed for this session
          resetJustPerformedRef.current = true;
        }
      } catch (error) {
        console.error("❌ Daily reset failed:", error);
      } finally {
        resetInProgress = false;
      }
    };

    // Initial reset check after data is loaded
    const initialTimeout = setTimeout(doLocalStorageResetIfNeeded, 1000);

    // Check for reset every hour
    const intervalId = setInterval(doLocalStorageResetIfNeeded, 1000 * 60 * 60);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]); // Run when loading completes

  // Manual sync function for testing
  const handleManualSync = async (showAlert = true) => {
    console.log("🔄 MANUAL SYNC TRIGGERED!");
    console.log("📊 Current data state:", {
      roadmap: roadmap ? "exists" : "null",
      todayTasks: todayTasks?.length || 0,
      books: books?.length || 0,
      goals: goals?.length || 0,
    });

    try {
      const promises = [];

      if (roadmap) {
        console.log("  📍 Syncing roadmap...");
        promises.push(syncData.saveRoadmap(roadmap));
      } else {
        console.log("  ⏭️ Skipping roadmap (null)");
      }

      if (todayTasks && todayTasks.length > 0) {
        console.log("  ✅ Syncing", todayTasks.length, "tasks...");
        const today = getDateString();
        const validCompletedTasks = filterTodayCompletedTasks(
          completedOneTimeTasks
        );

        promises.push(
          syncData.saveTodayTasks(todayTasks, validCompletedTasks, today)
        );
      } else {
        console.log(
          "  ⏭️ Skipping tasks (count:",
          todayTasks?.length || 0,
          ")"
        );
      }

      if (books && books.length > 0) {
        console.log("  📚 Syncing", books.length, "books...");
        promises.push(syncData.saveBooks(books));
      } else {
        console.log("  ⏭️ Skipping books (count:", books?.length || 0, ")");
      }

      if (goals && goals.length > 0) {
        console.log("  🎯 Syncing", goals.length, "goals...");
        promises.push(syncData.saveUserGoals(goals));
      } else {
        console.log("  ⏭️ Skipping goals (count:", goals?.length || 0, ")");
      }

      // Always sync pomodoro stats (from localStorage)
      const pomodoroStatsString = localStorage.getItem("pomodoroStats");
      if (pomodoroStatsString) {
        const pomodoroStats = JSON.parse(pomodoroStatsString);
        console.log("  ⏱️ Syncing pomodoro stats...");
        promises.push(syncData.savePomodoroStats(pomodoroStats));
      } else {
        console.log("  ⏭️ Skipping pomodoro stats (not in localStorage)");
      }

      console.log("  ⚙️ Syncing settings...");
      promises.push(syncData.saveAppSettings({ quoteIndex }));

      console.log("🚀 Total promises:", promises.length);
      await Promise.all(promises);
      console.log("✅ MANUAL SYNC COMPLETE!");
      if (showAlert) {
        alert("✅ Data synced to Supabase successfully!");
      }
    } catch (error) {
      console.error("❌ MANUAL SYNC FAILED:", error);
      if (showAlert) {
        alert("❌ Sync failed: " + error.message);
      }
    }
  };

  // Helper function to trigger sync for localStorage-only data (like pomodoro)
  window.triggerDataSync = () => {
    console.log("🔔 Sync triggered via window.triggerDataSync()");
    // Call without alert for auto-sync
    handleManualSync(false);
  };

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  const handleMasterAddTime = (taskNameToAdd, hours, minutes) => {
    console.log("🎯 handleMasterAddTime called:", {
      taskNameToAdd,
      hours,
      minutes,
    });

    // Block syncing while user is adding data
    isUserAddingDataRef.current = true;

    const newRoadmap = deepClone(roadmap);
    let totalMinutesToAdd =
      (parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0);

    console.log("⏰ totalMinutesToAdd:", totalMinutesToAdd);
    if (totalMinutesToAdd <= 0 || !taskNameToAdd) {
      console.log("❌ Invalid input, closing modal");
      isUserAddingDataRef.current = false;
      setMasterAddTimeModalOpen(false);
      return;
    }

    let remainingMinutes = totalMinutesToAdd;

    for (const phase of newRoadmap.phases) {
      for (const week of phase.weeks) {
        if (remainingMinutes <= 0) break;
        const task = week.topics.find(
          (t) => t.text === taskNameToAdd && t.type !== "book"
        );
        if (task && (task.completedMinutes || 0) < task.totalMinutes) {
          const canAdd = task.totalMinutes - (task.completedMinutes || 0);
          const toAdd = Math.min(remainingMinutes, canAdd);
          task.completedMinutes = (task.completedMinutes || 0) + toAdd;
          remainingMinutes -= toAdd;
        }
      }
      if (remainingMinutes <= 0) break;
    }

    // Add to today's progress
    const hoursAdded = (totalMinutesToAdd - remainingMinutes) / 60;
    console.log("📊 Adding to today progress:", hoursAdded, "hours");
    addToTodayProgress("hours", hoursAdded);

    console.log("✅ Setting new roadmap and closing modal");
    setRoadmap(newRoadmap);
    setMasterAddTimeModalOpen(false);

    // Save to localStorage immediately
    setTimeout(() => {
      isUserAddingDataRef.current = false;
      localStorage.setItem("roadmap", JSON.stringify(newRoadmap));
    }, 300);
  };

  const handleMasterAddPages = (taskNameToAdd, pages) => {
    console.log("📚 handleMasterAddPages called:", { taskNameToAdd, pages });

    // Block syncing while user is adding data
    isUserAddingDataRef.current = true;

    const newRoadmap = deepClone(roadmap);
    let pagesToAdd = parseInt(pages, 10) || 0;

    console.log("📖 pagesToAdd:", pagesToAdd);
    if (pagesToAdd <= 0 || !taskNameToAdd) {
      console.log("❌ Invalid input, closing modal");
      isUserAddingDataRef.current = false;
      setMasterAddTimeModalOpen(false);
      return;
    }

    let remainingPages = pagesToAdd;

    for (const phase of newRoadmap.phases) {
      for (const week of phase.weeks) {
        if (remainingPages <= 0) break;
        const task = week.topics.find(
          (t) => t.text === taskNameToAdd && t.type === "book"
        );
        if (task && (task.completedPages || 0) < task.totalPages) {
          const canAdd = task.totalPages - (task.completedPages || 0);
          const toAdd = Math.min(remainingPages, canAdd);
          task.completedPages = (task.completedPages || 0) + toAdd;
          remainingPages -= toAdd;
        }
      }
      if (remainingPages <= 0) break;
    }

    // Add to today's progress
    const pagesAdded = pagesToAdd - remainingPages;
    addToTodayProgress("pages", pagesAdded);

    setRoadmap(newRoadmap);
    setMasterAddTimeModalOpen(false);

    // Save to localStorage immediately
    setTimeout(() => {
      isUserAddingDataRef.current = false;
      localStorage.setItem("roadmap", JSON.stringify(newRoadmap));
    }, 300);
  };

  const handleAddWeeks = ({ numWeeks, startDate }) => {
    const weeks = parseInt(numWeeks, 10);
    if (isNaN(weeks) || weeks <= 0) return;

    const newRoadmap = {
      startDate: startDate,
      phases: [
        {
          phase: `${weeks}-Week Course Progress`,
          duration: `Weeks 1-${weeks}`,
          weeks: Array.from({ length: weeks }, (_, i) => ({
            week: i + 1,
            title: `Week ${i + 1} Tasks`,
            topics: [],
          })),
        },
      ],
    };
    setRoadmap(newRoadmap);
    setAddWeeksModalOpen(false);
  };

  const handleAddSpanningTask = (taskData) => {
    const newRoadmap = deepClone(roadmap);
    const { type, name, numWeeks } = taskData;
    const weeksToSpan = parseInt(numWeeks, 10) || 1;

    if (!name || weeksToSpan <= 0) {
      setSpanningTaskModalOpen(false);
      return;
    }

    const allFutureWeeks = newRoadmap.phases[0].weeks.slice(
      currentWeekNumber - 1
    );
    const visibleWeeks = allFutureWeeks.filter(
      (week) => calculateWeekProgress(week) < 100
    );

    // Check if user is trying to distribute across more weeks than available
    if (weeksToSpan > visibleWeeks.length) {
      const confirmed = window.confirm(
        `⚠️ Warning: You're trying to distribute this task across ${weeksToSpan} weeks, but only ${visibleWeeks.length} weeks are available in your current plan.\n\n` +
          `Click "OK" to distribute across the maximum available weeks (${visibleWeeks.length}), or "Cancel" to go back and adjust your input.`
      );

      if (!confirmed) {
        // User cancelled, don't close modal so they can adjust
        return;
      }

      // User confirmed, adjust to maximum available weeks
      taskData.numWeeks = visibleWeeks.length.toString();
      const adjustedWeeksToSpan = visibleWeeks.length;

      // Continue with the adjusted number of weeks
      return handleAddSpanningTaskWithValidation(
        taskData,
        adjustedWeeksToSpan,
        newRoadmap,
        visibleWeeks
      );
    }

    // Normal flow if weeks are within limits
    return handleAddSpanningTaskWithValidation(
      taskData,
      weeksToSpan,
      newRoadmap,
      visibleWeeks
    );
  };

  const handleAddSpanningTaskWithValidation = (
    taskData,
    weeksToSpan,
    newRoadmap,
    visibleWeeks
  ) => {
    const { type, name } = taskData;

    if (type === "time") {
      const totalMinutes =
        (parseInt(taskData.hours, 10) || 0) * 60 +
        (parseInt(taskData.minutes, 10) || 0);
      if (totalMinutes <= 0) return;
      const minutesPerDay = totalMinutes / (weeksToSpan * 7);
      const dailyTaskText = `${name} - ${formatDailyMinutes(minutesPerDay)}`;
      handleAddTodayTask(dailyTaskText, true);

      const minutesPerWeek = Math.floor(totalMinutes / weeksToSpan);
      const remainderMinutes = totalMinutes % weeksToSpan;

      for (let i = 0; i < weeksToSpan; i++) {
        if (i >= visibleWeeks.length) break;
        const week = visibleWeeks[i];
        let weekMinutes = minutesPerWeek + (i < remainderMinutes ? 1 : 0);
        if (weekMinutes > 0) {
          week.topics.push({
            id: `spanning-time-${Date.now()}-${i}`,
            text: name,
            type: "time",
            completedMinutes: 0,
            totalMinutes: weekMinutes,
          });
        }
      }
    } else if (type === "book") {
      const totalPages = parseInt(taskData.pages, 10) || 0;
      if (totalPages <= 0) return;
      const pagesPerDay = Math.ceil(totalPages / (weeksToSpan * 7));
      const dailyTaskText = `${name} - ${pagesPerDay} Pages`;
      handleAddTodayTask(dailyTaskText, true);

      const pagesPerWeek = Math.floor(totalPages / weeksToSpan);
      const remainderPages = totalPages % weeksToSpan;

      for (let i = 0; i < weeksToSpan; i++) {
        if (i >= visibleWeeks.length) break;
        const week = visibleWeeks[i];
        let weekPages = pagesPerWeek + (i < remainderPages ? 1 : 0);
        if (weekPages > 0) {
          week.topics.push({
            id: `spanning-book-${Date.now()}-${i}`,
            text: name,
            type: "book",
            completedPages: 0,
            totalPages: weekPages,
          });
        }
      }
    } else if (type === "day") {
      const totalDays = parseInt(taskData.days, 10) || 0;
      if (totalDays <= 0) return;
      const daysPerDay = Math.ceil(totalDays / (weeksToSpan * 7));
      const dailyTaskText = `${name} - ${daysPerDay} Day${
        daysPerDay > 1 ? "s" : ""
      }`;
      handleAddTodayTask(dailyTaskText, true);

      const daysPerWeek = Math.floor(totalDays / weeksToSpan);
      const remainderDays = totalDays % weeksToSpan;

      for (let i = 0; i < weeksToSpan; i++) {
        if (i >= visibleWeeks.length) break;
        const week = visibleWeeks[i];
        let weekDays = daysPerWeek + (i < remainderDays ? 1 : 0);
        if (weekDays > 0) {
          week.topics.push({
            id: `spanning-day-${Date.now()}-${i}`,
            text: name,
            type: "day",
            completedDays: 0,
            totalDays: weekDays,
          });
        }
      }
    }

    setRoadmap(newRoadmap);
    setSpanningTaskModalOpen(false);
    setSpanningTaskModalOpen(false);
  };

  const handleAddWeeklyTask = (weekNumber, taskData) => {
    const newRoadmap = deepClone(roadmap);
    const week = newRoadmap.phases[0].weeks.find((w) => w.week === weekNumber);
    if (week) {
      if (taskData.type === "course") {
        const totalMinutes =
          (parseInt(taskData.hours, 10) || 0) * 60 +
          (parseInt(taskData.minutes, 10) || 0);
        week.topics.push({
          text: taskData.name,
          totalMinutes: totalMinutes,
          completedMinutes: 0,
          id: `custom-roadmap-${Date.now()}`,
          type: "course",
        });

        const dailyMinutes = totalMinutes / 7;
        const dailyTaskText = `${taskData.name} - ${formatDailyMinutes(
          dailyMinutes
        )}`;
        handleAddTodayTask(dailyTaskText, true);

        // Also add to Track Progress section as a course task with daily portion (1/7th of weekly total)
        const dailyHours = Math.floor(dailyMinutes / 60);
        const remainingDailyMinutes = Math.round(dailyMinutes % 60);

        const newTodayTask = {
          id: `today-${Date.now()}`,
          name: `${taskData.name} (Daily)`,
          type: "course",
          totalHours: dailyHours,
          totalMinutes: remainingDailyMinutes,
          progressHours: 0,
          progressMinutes: 0,
        };

        const updatedTodayTasks = [...todayDailyTasks, newTodayTask];
        updateTodayDailyTasks(updatedTodayTasks);
      } else if (taskData.type === "book") {
        const totalPages = parseInt(taskData.pages, 10) || 0;
        week.topics.push({
          text: taskData.name,
          totalPages: totalPages,
          completedPages: 0,
          id: `custom-roadmap-${Date.now()}`,
          type: "book",
        });

        // Also add to Track Progress section as a book task with daily portion (1/7th of weekly total)
        const dailyPages = Math.ceil(totalPages / 7);
        const newTodayTask = {
          id: `today-${Date.now()}`,
          name: `${taskData.name} (Daily)`,
          type: "book",
          total: dailyPages,
          progress: 0,
        };

        const updatedTodayTasks = [...todayDailyTasks, newTodayTask];
        updateTodayDailyTasks(updatedTodayTasks);
      } else if (taskData.type === "day") {
        const totalDays = parseInt(taskData.days, 10) || 0;
        week.topics.push({
          text: taskData.name,
          totalDays: totalDays,
          completedDays: 0,
          id: `custom-roadmap-${Date.now()}`,
          type: "day",
        });

        // Also add to Track Progress section as a day task with daily portion (1/7th of weekly total)
        const dailyDays = Math.ceil(totalDays / 7);
        const newTodayTask = {
          id: `today-${Date.now()}`,
          name: `${taskData.name} (Daily)`,
          type: "day",
          total: dailyDays,
          progress: 0,
        };

        const updatedTodayTasks = [...todayDailyTasks, newTodayTask];
        updateTodayDailyTasks(updatedTodayTasks);
      } else if (taskData.type === "simple") {
        week.topics.push({
          text: taskData.name,
          completed: false,
          id: `custom-roadmap-${Date.now()}`,
          type: "simple",
        });
      }
    }
    setRoadmap(newRoadmap);
    setNewWeeklyTaskModal({ isOpen: false, weekNumber: null });
  };

  const handleDeleteRoadmapTask = (taskId) => {
    const newRoadmap = deepClone(roadmap);
    if (newRoadmap && newRoadmap.phases) {
      newRoadmap.phases.forEach((p) => {
        if (p.weeks) {
          p.weeks.forEach((w) => {
            if (w.topics) {
              w.topics = w.topics.filter((t) => t.id !== taskId);
            }
          });
        }
      });
    }
    setRoadmap(newRoadmap);
  };

  const handleEditRoadmapTask = (taskId, newText, additionalData = {}) => {
    const newRoadmap = deepClone(roadmap);
    for (const phase of newRoadmap.phases) {
      for (const week of phase.weeks) {
        const topic = week.topics.find((t) => t.id === taskId);
        if (topic) {
          topic.text = newText;
          // Handle additional properties like completion status for simple tasks
          Object.assign(topic, additionalData);
          break;
        }
      }
    }
    setRoadmap(newRoadmap);
  };

  const handleRenameWeekTitle = (weekNumber, newTitle) => {
    const newRoadmap = deepClone(roadmap);
    const week = newRoadmap.phases[0].weeks.find((w) => w.week === weekNumber);
    if (week) week.title = newTitle;
    setRoadmap(newRoadmap);
  };

  const handleAddTodayTask = (taskData) => {
    const today = new Date().getDay();

    // 🐛 DEBUG: Log incoming task data
    console.log("📥 Adding new task - Input data:", {
      rawTaskData: taskData,
      todayDayIndex: today,
    });

    const newTask = {
      text: taskData.text || taskData, // Support both old string format and new object format
      completed: false,
      id: `today-${Date.now()}`,
      isDaily:
        taskData.isDaily ||
        (typeof taskData === "string" ? false : taskData.isDaily),
      priority: taskData.priority || "normal",
      repeatType: taskData.repeatType || "none",
      selectedDays:
        taskData.repeatType === "weekly"
          ? [today]
          : taskData.selectedDays || [],
      category: taskData.category || "personal",
      createdAt: taskData.createdAt || new Date().toISOString(),
    };

    // 🐛 DEBUG: Log created task object
    console.log("✨ Task created - Final task object:", newTask);

    setTodayTasks((prev) => [...prev, newTask]);
  };
  const handleToggleTodayTask = (taskId) =>
    setTodayTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (!task) return prev;

      // If task is being completed and it's a one-time task (no repeat, regardless of priority)
      if (!task.completed && task.repeatType === "none") {
        // Store it as completed one-time task for progress tracking
        setCompletedOneTimeTasks((prevCompleted) => {
          // Check if this task is already in the completed list (prevent duplicates)
          const alreadyExists = prevCompleted.some((t) => t.id === taskId);
          if (alreadyExists) {
            console.warn(
              "⚠️ Task already in completedOneTimeTasks, skipping duplicate:",
              taskId
            );
            return prevCompleted;
          }
          return [
            ...prevCompleted,
            { ...task, completed: true, completedAt: new Date().toISOString() },
          ];
        });
        // Remove it permanently from the main list
        return prev.filter((t) => t.id !== taskId);
      }

      // For repeating tasks, just toggle completion status and update completedAt
      return prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed
                ? new Date().toISOString()
                : t.completedAt,
            }
          : t
      );
    });
  const handleDeleteTodayTask = (taskId) =>
    setTodayTasks((prev) => prev.filter((task) => task.id !== taskId));
  const handleEditTodayTask = (taskId, newText) =>
    setTodayTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, text: newText } : task
      )
    );

  const handleSkipTask = (taskId) => {
    const today = getDateString();
    const task = todayTasks.find((t) => t.id === taskId);

    if (!task) return;

    // Add to skipped tasks with today's date
    setSkippedTasks((prev) => {
      // Remove any existing skip entries for this task
      const filtered = prev.filter((st) => st.taskId !== taskId);
      return [...filtered, { taskId, skipDate: today, taskData: task }];
    });

    console.log("⏭️ Task skipped for today:", {
      taskId,
      taskName: task.text,
      skipDate: today,
      repeatType: task.repeatType,
      selectedDays: task.selectedDays,
      isDaily: task.isDaily,
    });
  };

  const handleConfirmReset = () => {
    localStorage.removeItem("roadmap");
    localStorage.removeItem("currentBooks");
    setRoadmap(null);
    setBooks([]);
    setResetModalOpen(false);
  };

  // --- Import / Export Logic ---
  const handleExport = () => {
    try {
      const backupData = {
        // Home and Progress page data (existing)
        roadmap,
        todayTasks,
        books,
        todayTasksLastReset:
          localStorage.getItem("todayTasksLastReset") || getDateString(),

        // Track page data (Pomodoro Timer & Analytics)
        pomodoroStats: localStorage.getItem("pomodoroStats") || null,
        userGoals: localStorage.getItem("userGoals") || null,

        // Additional app state
        todayDailyTasks: localStorage.getItem("todayDailyTasks") || null,
        quoteIndex: localStorage.getItem("quoteIndex") || "0",
        currentBooks: localStorage.getItem("currentBooks") || null,

        // Daily progress data (for any date-specific progress tracking)
        dailyProgressData: (() => {
          const progressData = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("dailyProgress_")) {
              progressData[key] = localStorage.getItem(key);
            }
          }
          return Object.keys(progressData).length > 0 ? progressData : null;
        })(),

        // Export metadata
        exportDate: new Date().toISOString(),
        appVersion: "2.0",
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `progress-tracker-backup-${getDateString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(
        "✅ Export completed with all app data:",
        Object.keys(backupData)
      );
    } catch (error) {
      console.error("Failed to export data:", error);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);

          console.log("📥 Imported data structure:", Object.keys(importedData));
          console.log("📥 Full imported data:", importedData);

          // More flexible validation - check if it's a valid backup file
          const hasEssentialData =
            importedData &&
            typeof importedData === "object" &&
            (importedData.roadmap !== undefined ||
              importedData.todayTasks !== undefined ||
              importedData.books !== undefined ||
              importedData.pomodoroStats !== undefined);

          if (hasEssentialData) {
            console.log("✅ Valid backup file detected, importing data...");

            // Import Home and Progress page data AND save to localStorage immediately
            if (importedData.roadmap !== undefined) {
              console.log("📊 Importing roadmap data");
              setRoadmap(importedData.roadmap);
              localStorage.setItem(
                "roadmap",
                JSON.stringify(importedData.roadmap)
              );
            }

            if (importedData.todayTasks !== undefined) {
              console.log("📋 Importing today tasks data");
              setTodayTasks(importedData.todayTasks);
              localStorage.setItem(
                "todayTasks",
                JSON.stringify(importedData.todayTasks)
              );
            }

            if (importedData.books !== undefined) {
              console.log("📚 Importing books data");
              setBooks(importedData.books || []);
              localStorage.setItem(
                "books",
                JSON.stringify(importedData.books || [])
              );
            }

            // Import localStorage data
            if (importedData.todayTasksLastReset) {
              console.log("📅 Importing today tasks last reset data");
              localStorage.setItem(
                "todayTasksLastReset",
                importedData.todayTasksLastReset
              );
            }

            // Import Track page data (Pomodoro & Analytics)
            if (importedData.pomodoroStats) {
              console.log("🍅 Importing pomodoro stats data");
              localStorage.setItem("pomodoroStats", importedData.pomodoroStats);
            }

            if (importedData.userGoals) {
              console.log("🎯 Importing user goals data");
              localStorage.setItem("userGoals", importedData.userGoals);
            }

            // Import additional app state
            if (importedData.todayDailyTasks) {
              console.log("📝 Importing today daily tasks data");
              localStorage.setItem(
                "todayDailyTasks",
                importedData.todayDailyTasks
              );
            }

            if (importedData.quoteIndex) {
              console.log("💭 Importing quote index data");
              localStorage.setItem("quoteIndex", importedData.quoteIndex);
            }

            if (importedData.currentBooks) {
              console.log("📖 Importing current books data");
              localStorage.setItem("currentBooks", importedData.currentBooks);
            }

            // Import daily progress data
            if (importedData.dailyProgressData) {
              console.log("📈 Importing daily progress data");
              Object.entries(importedData.dailyProgressData).forEach(
                ([key, value]) => {
                  if (key.startsWith("dailyProgress_")) {
                    localStorage.setItem(key, value);
                  }
                }
              );
            }

            console.log("✅ Import completed successfully with all app data");

            // Sync imported data to Supabase if logged in
            if (userId) {
              console.log("☁️ Syncing imported data to Supabase...");

              const syncPromises = [];

              if (importedData.roadmap !== undefined) {
                syncPromises.push(syncData.saveRoadmap(importedData.roadmap));
              }

              if (importedData.todayTasks !== undefined) {
                const today = getDateString();
                const validCompletedTasks = filterTodayCompletedTasks(
                  importedData.completedOneTimeTasks || []
                );

                syncPromises.push(
                  syncData.saveTodayTasks(
                    importedData.todayTasks,
                    validCompletedTasks,
                    today
                  )
                );
              }

              if (importedData.books !== undefined) {
                syncPromises.push(syncData.saveBooks(importedData.books || []));
              }

              if (importedData.userGoals) {
                const goals = JSON.parse(importedData.userGoals);
                syncPromises.push(syncData.saveUserGoals(goals));
              }

              if (importedData.pomodoroStats) {
                const stats = JSON.parse(importedData.pomodoroStats);
                syncPromises.push(syncData.savePomodoroStats(stats));
              }

              if (importedData.quoteIndex) {
                syncPromises.push(
                  syncData.saveAppSettings({
                    quoteIndex: parseInt(importedData.quoteIndex),
                  })
                );
              }

              // Sync all daily progress entries
              if (importedData.dailyProgressData) {
                Object.entries(importedData.dailyProgressData).forEach(
                  ([key, value]) => {
                    if (key.startsWith("dailyProgress_")) {
                      const date = key.replace("dailyProgress_", "");
                      const progress = JSON.parse(value);
                      syncPromises.push(
                        syncData.saveDailyProgress(date, progress)
                      );
                    }
                  }
                );
              }

              Promise.all(syncPromises)
                .then(() => {
                  console.log("✅ All imported data synced to Supabase!");
                  alert(
                    "Data imported and synced to cloud successfully! The page will refresh to apply all changes."
                  );
                  setTimeout(() => window.location.reload(), 100);
                })
                .catch((err) => {
                  console.error("❌ Failed to sync imported data:", err);
                  alert(
                    "Data imported to local storage but failed to sync to cloud. Page will refresh.\n\nError: " +
                      err.message
                  );
                  setTimeout(() => window.location.reload(), 100);
                });
            } else {
              alert(
                "Data imported successfully! The page will refresh to apply all changes."
              );
              setTimeout(() => window.location.reload(), 100);
            }
          } else {
            console.error(
              "Invalid backup file format - no recognizable data found."
            );
            console.error(
              "Available keys in file:",
              Object.keys(importedData || {})
            );
            alert(
              "Invalid backup file format. This doesn't appear to be a Progress Tracker backup file.\n\nAvailable data: " +
                Object.keys(importedData || {}).join(", ") +
                "\n\nPlease select a valid backup file."
            );
          }
        } catch (error) {
          console.error("Failed to parse backup file:", error);
          alert(
            "Failed to import data. Please check that the file is a valid JSON backup."
          );
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const currentWeekNumber = useMemo(() => {
    if (!roadmap || !roadmap.phases || roadmap.phases.length === 0) return 1;
    return getCurrentWeekNumber(
      roadmap.startDate,
      roadmap.phases[0].weeks.length
    );
  }, [roadmap]);

  const overallProgress = useMemo(() => {
    if (!roadmap || !roadmap.phases) return 0;
    let totalTasks = 0;
    let totalProgress = 0;
    roadmap.phases.forEach((phase) => {
      if (!phase.weeks) return;
      phase.weeks.forEach((week) => {
        if (!week.topics) return;
        week.topics.forEach((topic) => {
          totalTasks++;
          if (topic.type === "book") {
            const completed = topic.completedPages || 0;
            const total = topic.totalPages || 1;
            totalProgress += (completed / total) * 100;
          } else if (topic.type === "day") {
            const completed = topic.completedDays || 0;
            const total = topic.totalDays || 1;
            totalProgress += (completed / total) * 100;
          } else if (topic.type === "simple") {
            totalProgress += topic.completed ? 100 : 0;
          } else {
            const completed = topic.completedMinutes || 0;
            const total = topic.totalMinutes || 1;
            totalProgress += (completed / total) * 100;
          }
        });
      });
    });
    return totalTasks > 0 ? totalProgress / totalTasks : 0;
  }, [roadmap]);

  const aggregatedStats = useMemo(() => {
    if (!roadmap || !roadmap.phases)
      return { courses: {}, books: {}, challenges: {} };

    const courses = {};
    const books = {};
    const challenges = {};

    roadmap.phases.forEach((phase) => {
      if (!phase.weeks) return;
      phase.weeks.forEach((week) => {
        if (!week.topics) return;
        week.topics.forEach((topic) => {
          if (topic.type === "book") {
            if (!books[topic.text]) books[topic.text] = 0;
            books[topic.text] += topic.completedPages || 0;
          } else if (topic.type === "day") {
            if (!challenges[topic.text]) challenges[topic.text] = 0;
            challenges[topic.text] += topic.completedDays || 0;
          } else {
            if (!courses[topic.text]) courses[topic.text] = 0;
            courses[topic.text] += topic.completedMinutes || 0;
          }
        });
      });
    });

    return { courses, books, challenges };
  }, [roadmap]);

  const openNewTaskModal = (weekNumber) => {
    setNewWeeklyTaskModal({ isOpen: true, weekNumber });
  };

  // --- Today Section State ---
  const [addTodayTaskModalOpen, setAddTodayTaskModalOpen] = useState(false);
  const [editingTodayTask, setEditingTodayTask] = useState(null);
  const [addTodayProgressModalOpen, setAddTodayProgressModalOpen] =
    useState(false);
  const [weeklyProgressModalOpen, setWeeklyProgressModalOpen] = useState(false);
  const [selectedWeeklyTask, setSelectedWeeklyTask] = useState(null);
  const [selectedTodayTask, setSelectedTodayTask] = useState(null);

  // Weekly Progress Modal
  const openProgressModal = (task) => {
    setSelectedWeeklyTask(task);
    setWeeklyProgressModalOpen(true);
  };

  // Today Progress Modal
  const openTodayProgressModal = (task) => {
    setSelectedTodayTask(task);
    setAddTodayProgressModalOpen(true);
  };

  // --- Today Section Handlers ---
  const handleSaveTodayTaskFromModal = (taskData) => {
    if (editingTodayTask) {
      // Update existing task
      const updatedTasks = todayDailyTasks.map((task) =>
        task.id === editingTodayTask.id ? { ...task, ...taskData } : task
      );
      updateTodayDailyTasks(updatedTasks);
    } else {
      // Add new task
      const newTask = {
        id: `today-${Date.now()}`,
        ...taskData,
        ...(taskData.type === "course"
          ? { progressHours: 0, progressMinutes: 0 }
          : { progress: 0 }),
      };
      const updatedTasks = [...todayDailyTasks, newTask];
      updateTodayDailyTasks(updatedTasks);
    }

    setAddTodayTaskModalOpen(false);
    setEditingTodayTask(null);
  };

  // Enhanced progress handler with overflow logic
  const handleAddTodayProgressWithOverflow = (progressData) => {
    console.log("🔧 Enhanced progress handler called with:", progressData);

    if (progressData.hours !== undefined) {
      console.log("⏰ Processing time-based progress");
      // Handle time-based progress with overflow
      const updatedTasks = todayDailyTasks.map((task) => {
        if (task.id === progressData.taskId) {
          console.log("📋 Found matching task:", task);

          const newProgressMinutes =
            (task.progressMinutes || 0) + progressData.minutes;
          const newProgressHours =
            (task.progressHours || 0) +
            progressData.hours +
            Math.floor(newProgressMinutes / 60);
          const finalProgressMinutes = newProgressMinutes % 60;

          // Calculate total available time for this task
          const totalMinutesTotal =
            (task.totalHours || 0) * 60 + (task.totalMinutes || 0);
          const currentProgressMinutes =
            newProgressHours * 60 + finalProgressMinutes;

          console.log(`📊 Progress calculation:
            - Current: ${newProgressHours}h ${finalProgressMinutes}m (${currentProgressMinutes} total minutes)
            - Target: ${task.totalHours || 0}h ${
            task.totalMinutes || 0
          }m (${totalMinutesTotal} total minutes)
            - Overflow: ${currentProgressMinutes - totalMinutesTotal} minutes`);

          if (currentProgressMinutes >= totalMinutesTotal) {
            // Calculate overflow
            const overflowMinutes = currentProgressMinutes - totalMinutesTotal;

            console.log(`🚀 Overflow detected: ${overflowMinutes} minutes`);

            if (overflowMinutes > 0) {
              // Handle overflow to next week
              handleOverflowToNextWeek(task, overflowMinutes);
            }

            return {
              ...task,
              progressHours: task.totalHours || 0,
              progressMinutes: task.totalMinutes || 0,
            };
          }

          return {
            ...task,
            progressHours: newProgressHours,
            progressMinutes: finalProgressMinutes,
          };
        }
        return task;
      });

      updateTodayDailyTasks(updatedTasks);
    } else if (progressData.pages !== undefined) {
      // Handle page-based progress with overflow
      console.log("📚 Processing page-based progress");
      const updatedTasks = todayDailyTasks.map((task) => {
        if (task.id === progressData.taskId) {
          console.log("📋 Found matching book task:", task);

          const newProgress = (task.progress || 0) + progressData.pages;
          const totalPages = task.total || 0;

          console.log(`📊 Book progress calculation:
            - Current: ${newProgress} pages
            - Target: ${totalPages} pages
            - Overflow: ${newProgress - totalPages} pages`);

          if (newProgress >= totalPages) {
            // Calculate overflow pages
            const overflowPages = newProgress - totalPages;

            console.log(`🚀 Book overflow detected: ${overflowPages} pages`);

            if (overflowPages > 0) {
              // Handle overflow to next week for page-based tasks
              handleOverflowToNextWeek(task, overflowPages, "pages");
            }

            return {
              ...task,
              progress: totalPages,
            };
          }

          return {
            ...task,
            progress: newProgress,
          };
        }
        return task;
      });

      updateTodayDailyTasks(updatedTasks);
    } else if (progressData.days !== undefined) {
      // Handle day-based progress with overflow
      const updatedTasks = todayDailyTasks.map((task) => {
        if (task.id === progressData.taskId) {
          const newProgress = (task.progress || 0) + progressData.days;
          const totalDays = task.total || 0;

          if (newProgress >= totalDays) {
            // Calculate overflow days
            const overflowDays = newProgress - totalDays;

            if (overflowDays > 0) {
              // Handle overflow to next week for day-based tasks
              handleOverflowToNextWeek(task, overflowDays, "days");
            }

            return {
              ...task,
              progress: totalDays,
            };
          }

          return {
            ...task,
            progress: newProgress,
          };
        }
        return task;
      });

      updateTodayDailyTasks(updatedTasks);
    }

    // Update progress statistics
    console.log("📊 Updating daily progress statistics");
    if (progressData.hours !== undefined) {
      const hoursAdded = progressData.hours || 0;
      addToTodayProgress("hours", hoursAdded);
    } else if (progressData.pages !== undefined) {
      const pagesAdded = progressData.pages || 0;
      addToTodayProgress("pages", pagesAdded);
    } else if (progressData.days !== undefined) {
      const daysAdded = progressData.days || 0;
      addToTodayProgress("days", daysAdded);
    }
  };

  // Function to handle overflow to next week
  const handleOverflowToNextWeek = (
    currentTask,
    overflowAmount,
    progressType = "time"
  ) => {
    console.log(`⏭️ Starting overflow process:
      - Task: ${currentTask.name}
      - Overflow: ${overflowAmount} ${
      progressType === "time" ? "minutes" : "days"
    }
      - Type: ${progressType}`);

    const newRoadmap = deepClone(roadmap);
    const currentWeek = getCurrentWeekNumber(new Date());

    console.log(`📅 Current week: ${currentWeek}`);

    // Find next week
    const nextWeekNumber = currentWeek + 1;
    let nextWeek = newRoadmap.phases[0].weeks.find(
      (w) => w.week === nextWeekNumber
    );

    console.log(`🔍 Looking for week ${nextWeekNumber}, found:`, nextWeek);

    // If next week doesn't exist, create it
    if (!nextWeek) {
      console.log(`✨ Creating new week ${nextWeekNumber}`);
      nextWeek = {
        week: nextWeekNumber,
        topics: [],
        weekGoal: "Continue progress",
        keyTakeaways: [],
      };
      newRoadmap.phases[0].weeks.push(nextWeek);
    }

    // Look for existing similar task in next week
    let existingTask = nextWeek.topics.find(
      (topic) =>
        topic.text === currentTask.name.replace(" (Daily)", "") &&
        topic.type === currentTask.type
    );

    if (progressType === "time") {
      // Handle time-based overflow
      const overflowHours = Math.floor(overflowAmount / 60);
      const overflowMinutes = overflowAmount % 60;

      if (existingTask) {
        // Add to existing task
        existingTask.completedMinutes =
          (existingTask.completedMinutes || 0) + overflowAmount;
      } else {
        // Create new task in next week with overflow as initial progress
        const taskName = currentTask.name.replace(" (Daily)", "");
        nextWeek.topics.push({
          text: taskName,
          totalMinutes:
            (currentTask.totalHours || 0) * 60 +
            (currentTask.totalMinutes || 0),
          completedMinutes: overflowAmount,
          id: `overflow-${Date.now()}`,
          type: currentTask.type,
        });

        // Also add to daily tasks for next week (when it becomes current)
        // This will be handled by the daily reset logic
      }

      console.log(
        `⏭️ Overflow: Added ${overflowHours}h ${overflowMinutes}m of "${currentTask.name}" to week ${nextWeekNumber}`
      );
    } else if (progressType === "days") {
      // Handle day-based overflow
      if (existingTask) {
        existingTask.progress = (existingTask.progress || 0) + overflowAmount;
      } else {
        const taskName = currentTask.name.replace(" (Daily)", "");
        nextWeek.topics.push({
          text: taskName,
          total: currentTask.total || 0,
          progress: overflowAmount,
          id: `overflow-${Date.now()}`,
          type: currentTask.type,
        });
      }

      console.log(
        `⏭️ Overflow: Added ${overflowAmount} days of "${currentTask.name}" to week ${nextWeekNumber}`
      );
    }

    // Update roadmap with overflow
    setRoadmap(newRoadmap);

    // Show notification about overflow
    const taskName = currentTask.name.replace(" (Daily)", "");
    const overflowText =
      progressType === "time"
        ? `${Math.floor(overflowAmount / 60)}h ${overflowAmount % 60}m`
        : `${overflowAmount} days`;

    alert(
      `✨ Great progress! You completed this week's target for "${taskName}".\n\n${overflowText} has been automatically added to next week (Week ${nextWeekNumber}).`
    );
  };

  // Function to handle overflow for weekly tasks in Progress page
  const handleWeeklyOverflowToNextWeek = (
    currentTask,
    currentWeekNumber,
    overflowAmount,
    progressType
  ) => {
    console.log(`⏭️ Starting weekly overflow process:
      - Task: ${currentTask.text}
      - Current week: ${currentWeekNumber}
      - Overflow: ${overflowAmount} ${progressType}
      - Type: ${progressType}`);

    const nextWeekNumber = currentWeekNumber + 1;

    // Get the current roadmap state
    setRoadmap((currentRoadmap) => {
      const newRoadmap = deepClone(currentRoadmap);

      // Find next week
      let nextWeek = newRoadmap.phases[0].weeks.find(
        (w) => w.week === nextWeekNumber
      );

      console.log(`🔍 Looking for week ${nextWeekNumber}, found:`, nextWeek);

      // If next week doesn't exist, create it
      if (!nextWeek) {
        console.log(`✨ Creating new week ${nextWeekNumber}`);
        nextWeek = {
          week: nextWeekNumber,
          topics: [],
          weekGoal: "Continue progress",
          keyTakeaways: [],
        };
        newRoadmap.phases[0].weeks.push(nextWeek);
        // Sort weeks by week number
        newRoadmap.phases[0].weeks.sort((a, b) => a.week - b.week);
      }

      // Look for existing similar task in next week
      let existingTask = nextWeek.topics.find(
        (topic) =>
          topic.text === currentTask.text && topic.type === currentTask.type
      );

      if (existingTask) {
        console.log(`🔄 Found existing task in next week, adding overflow`);
        // Add to existing task
        if (progressType === "minutes") {
          existingTask.completedMinutes =
            (existingTask.completedMinutes || 0) + overflowAmount;
        } else if (progressType === "pages") {
          existingTask.completedPages =
            (existingTask.completedPages || 0) + overflowAmount;
        } else if (progressType === "days") {
          existingTask.completedDays =
            (existingTask.completedDays || 0) + overflowAmount;
        }
      } else {
        console.log(`✨ Creating new task in next week with overflow`);
        // Create new task in next week with overflow as initial progress
        const newTask = {
          text: currentTask.text,
          id: `overflow-${Date.now()}`,
          type: currentTask.type,
        };

        if (progressType === "minutes") {
          newTask.totalMinutes = currentTask.totalMinutes || 0;
          newTask.completedMinutes = overflowAmount;
        } else if (progressType === "pages") {
          newTask.totalPages = currentTask.totalPages || 0;
          newTask.completedPages = overflowAmount;
        } else if (progressType === "days") {
          newTask.totalDays = currentTask.totalDays || 0;
          newTask.completedDays = overflowAmount;
        }

        nextWeek.topics.push(newTask);
      }

      console.log("📝 Updated roadmap with overflow:", newRoadmap);
      console.log("📝 Next week after overflow:", nextWeek);

      // Force localStorage update
      setTimeout(() => {
        localStorage.setItem("roadmap", JSON.stringify(newRoadmap));
        console.log("💾 Roadmap saved to localStorage");
      }, 100);

      return newRoadmap;
    });

    // Show notification about overflow
    let overflowText;
    if (progressType === "minutes") {
      const hours = Math.floor(overflowAmount / 60);
      const minutes = overflowAmount % 60;
      overflowText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    } else if (progressType === "pages") {
      overflowText = `${overflowAmount} pages`;
    } else if (progressType === "days") {
      overflowText = `${overflowAmount} days`;
    }

    setTimeout(() => {
      alert(
        `✨ Excellent work! You completed this week's target for "${currentTask.text}".\n\n${overflowText} has been automatically added to Week ${nextWeekNumber}.`
      );
    }, 500);
  };

  const handleAddTodayProgressFromModal = (progressData) => {
    console.log("🎯 Main progress handler called with:", progressData);
    // Use the enhanced handler with overflow logic
    handleAddTodayProgressWithOverflow(progressData);

    setAddTodayProgressModalOpen(false);
    setSelectedTodayTask(null);
  };

  const handleWeeklyProgressFromModal = (progressData) => {
    console.log("🔧 Weekly progress handler called with:", progressData);

    let overflowDetected = false;
    let overflowData = null;

    const updatedRoadmap = {
      ...roadmap,
      phases: roadmap.phases.map((phase) => ({
        ...phase,
        weeks: phase.weeks.map((weekData) => ({
          ...weekData,
          topics: weekData.topics.map((topic) => {
            if (topic.id === progressData.taskId) {
              console.log("📋 Found matching weekly task:", topic);

              if (topic.type === "book") {
                const newCompletedPages =
                  (topic.completedPages || 0) + progressData.pages;
                const totalPages = topic.totalPages || 0;

                console.log(
                  `📚 Book progress: ${newCompletedPages}/${totalPages} pages`
                );

                if (newCompletedPages >= totalPages) {
                  const overflowPages = newCompletedPages - totalPages;
                  console.log(
                    `🚀 Book overflow detected: ${overflowPages} pages`
                  );

                  if (overflowPages > 0) {
                    overflowDetected = true;
                    overflowData = {
                      topic,
                      weekNumber: weekData.week,
                      overflow: overflowPages,
                      type: "pages",
                    };
                  }

                  return {
                    ...topic,
                    completedPages: totalPages,
                  };
                }

                return {
                  ...topic,
                  completedPages: newCompletedPages,
                };
              } else if (topic.type === "day") {
                const newCompletedDays =
                  (topic.completedDays || 0) + progressData.days;
                const totalDays = topic.totalDays || 0;

                console.log(
                  `📅 Day challenge progress: ${newCompletedDays}/${totalDays} days`
                );

                if (newCompletedDays >= totalDays) {
                  const overflowDays = newCompletedDays - totalDays;
                  console.log(
                    `🚀 Day challenge overflow detected: ${overflowDays} days`
                  );

                  if (overflowDays > 0) {
                    overflowDetected = true;
                    overflowData = {
                      topic,
                      weekNumber: weekData.week,
                      overflow: overflowDays,
                      type: "days",
                    };
                  }

                  return {
                    ...topic,
                    completedDays: totalDays,
                  };
                }

                return {
                  ...topic,
                  completedDays: newCompletedDays,
                };
              } else {
                // Course type - time-based
                const newCompletedMinutes =
                  (topic.completedMinutes || 0) + progressData.minutes;
                const totalMinutes = topic.totalMinutes || 0;

                console.log(
                  `⏰ Course progress: ${Math.floor(
                    newCompletedMinutes / 60
                  )}h ${newCompletedMinutes % 60}m / ${Math.floor(
                    totalMinutes / 60
                  )}h ${totalMinutes % 60}m`
                );

                if (newCompletedMinutes >= totalMinutes) {
                  const overflowMinutes = newCompletedMinutes - totalMinutes;
                  console.log(
                    `🚀 Course overflow detected: ${Math.floor(
                      overflowMinutes / 60
                    )}h ${overflowMinutes % 60}m`
                  );

                  if (overflowMinutes > 0) {
                    overflowDetected = true;
                    overflowData = {
                      topic,
                      weekNumber: weekData.week,
                      overflow: overflowMinutes,
                      type: "minutes",
                    };
                  }

                  return {
                    ...topic,
                    completedMinutes: totalMinutes,
                  };
                }

                return {
                  ...topic,
                  completedMinutes: newCompletedMinutes,
                };
              }
            }
            return topic;
          }),
        })),
      })),
    };

    // First update the current week's progress
    console.log("📝 Setting roadmap with current week progress...");
    setRoadmap(updatedRoadmap);

    // Then handle overflow if detected
    if (overflowDetected && overflowData) {
      console.log("⏭️ Processing overflow...");
      // Use setTimeout to ensure the first roadmap update completes
      setTimeout(() => {
        handleWeeklyOverflowToNextWeek(
          overflowData.topic,
          overflowData.weekNumber,
          overflowData.overflow,
          overflowData.type
        );
      }, 200);
    }

    setWeeklyProgressModalOpen(false);
    setSelectedWeeklyTask(null);
  };

  const handleDeleteTodayDailyTask = (taskId) => {
    const updatedTasks = todayDailyTasks.filter((task) => task.id !== taskId);
    updateTodayDailyTasks(updatedTasks);
  };

  const handleResetTodayDailyTask = (taskId) => {
    const updatedTasks = todayDailyTasks.map((task) => {
      if (task.id === taskId) {
        if (task.type === "course") {
          return { ...task, progressHours: 0, progressMinutes: 0 };
        } else {
          return { ...task, progress: 0 };
        }
      }
      return task;
    });
    updateTodayDailyTasks(updatedTasks);
  };

  // --- Drag and Drop Handlers for Track Page ---
  const handleDragStart = (e, taskId) => {
    console.log("🔄 Drag started for task:", taskId);
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragEnd = (e) => {
    console.log("🔄 Drag ended");
    setDraggedTaskId(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    // Always allow drop and set drag over index, don't depend on state
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    // Always set drag over index, don't depend on state
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Only clear if we're leaving the entire list item
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();

    // Get dragged task ID from dataTransfer first, fallback to state
    let draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId) {
      draggedId = draggedTaskId;
    }

    console.log("🎯 Drop at index:", dropIndex, "dragged task:", draggedId);

    if (!draggedId) {
      console.log("❌ No dragged task");
      setDragOverIndex(null);
      return;
    }

    const draggedIndex = todayDailyTasks.findIndex(
      (task) => task.id === draggedId
    );
    console.log("📍 Dragged index:", draggedIndex, "Drop index:", dropIndex);

    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      console.log("❌ Invalid indices or same position");
      setDragOverIndex(null);
      return;
    }

    // Create new array with reordered tasks
    const newTasks = [...todayDailyTasks];
    const draggedTask = newTasks[draggedIndex];

    // Remove dragged task from original position
    newTasks.splice(draggedIndex, 1);

    // Insert at new position
    newTasks.splice(dropIndex, 0, draggedTask);

    console.log(
      "✅ Reordered tasks:",
      newTasks.map((t) => t.name)
    );
    updateTodayDailyTasks(newTasks);
    setDraggedTaskId(null);
    setDragOverIndex(null);
  };

  // --- Today Section UI ---
  const TodaySection = () => {
    // Calculate overall progress for today's tasks
    const overallProgressCalc = (() => {
      if (todayDailyTasks.length === 0) return 0;
      const totalProgress = todayDailyTasks.reduce((sum, task) => {
        let taskProgress = 0;
        if (task.type === "course") {
          const totalMinutes =
            (task.totalHours || 0) * 60 + (task.totalMinutes || 0);
          const progressMinutes =
            (task.progressHours || 0) * 60 + (task.progressMinutes || 0);
          taskProgress =
            totalMinutes > 0 ? (progressMinutes / totalMinutes) * 100 : 0;
        } else {
          taskProgress =
            (task.total || 0) > 0
              ? ((task.progress || 0) / (task.total || 0)) * 100
              : 0;
        }
        return sum + taskProgress;
      }, 0);
      return totalProgress / todayDailyTasks.length;
    })();

    // Helper function to format time display
    const formatTimeDisplay = (hours, minutes) => {
      const parts = [];
      if (hours > 0) parts.push(`${hours}H`);
      if (minutes > 0) parts.push(`${minutes}M`);
      return parts.length > 0 ? parts.join(" ") : "0M";
    };

    return (
      <>
        {/* Overall Progress Section */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-6">
              <div className="flex-1 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Overall Progress
                </h2>
                <span className="text-lg font-mono text-indigo-600 font-semibold ml-4">
                  {overallProgressCalc.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="px-6 pb-6">
              <ProgressBar percentage={overallProgressCalc} />
            </div>
          </div>
        </section>

        {/* Track Progress Section */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="w-full flex justify-between items-center p-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                Track Progress
              </h2>
              <button
                onClick={() => {
                  setEditingTodayTask(null);
                  setAddTodayTaskModalOpen(true);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center"
              >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Add Task</span>
              </button>
            </div>
            <div className="px-6 pb-6">
              {todayDailyTasks.length === 0 ? (
                <div className="text-gray-500 text-center py-6">
                  No progress tracking tasks added yet.
                </div>
              ) : (
                <ul className="space-y-4 mt-4">
                  {todayDailyTasks.map((task, index) => {
                    let percent = 0;
                    let progressDisplay = "";
                    let totalDisplay = "";

                    if (task.type === "course") {
                      const totalMinutes =
                        (task.totalHours || 0) * 60 + (task.totalMinutes || 0);
                      const progressMinutes =
                        (task.progressHours || 0) * 60 +
                        (task.progressMinutes || 0);
                      percent =
                        totalMinutes > 0
                          ? (progressMinutes / totalMinutes) * 100
                          : 0;

                      progressDisplay = formatTimeDisplay(
                        task.progressHours || 0,
                        task.progressMinutes || 0
                      );
                      totalDisplay = formatTimeDisplay(
                        task.totalHours || 0,
                        task.totalMinutes || 0
                      );
                    } else if (task.type === "book") {
                      percent =
                        (task.total || 0) > 0
                          ? ((task.progress || 0) / (task.total || 0)) * 100
                          : 0;
                      progressDisplay = `${task.progress || 0}`;
                      totalDisplay = `${task.total || 0}`;
                    } else if (task.type === "day") {
                      percent =
                        (task.total || 0) > 0
                          ? ((task.progress || 0) / (task.total || 0)) * 100
                          : 0;
                      progressDisplay = `${task.progress || 0}`;
                      totalDisplay = `${task.total || 0}`;
                    } else {
                      // Fallback for any other type
                      percent =
                        (task.total || 0) > 0
                          ? ((task.progress || 0) / (task.total || 0)) * 100
                          : 0;
                      progressDisplay = `${task.progress || 0}`;
                      totalDisplay = `${task.total || 0}`;
                    }

                    let barColor = "bg-red-500";
                    if (percent >= 80) barColor = "bg-green-500";
                    else if (percent >= 60) barColor = "bg-blue-500";
                    else if (percent >= 40) barColor = "bg-yellow-400";
                    else if (percent >= 20) barColor = "bg-orange-500";

                    return (
                      <li
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`bg-gray-50 rounded-lg p-4 flex flex-col gap-2 shadow-sm border border-gray-100 group cursor-move transition-all duration-200 ${
                          dragOverIndex === index
                            ? "border-indigo-400 bg-indigo-50 shadow-md"
                            : ""
                        } ${
                          draggedTaskId === task.id
                            ? "opacity-50 shadow-lg"
                            : ""
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                              <DragHandleIcon className="w-5 h-5" />
                            </div>
                            <div className="font-semibold text-gray-800 text-lg">
                              {task.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTodayProgressModal(task);
                                }}
                                className="p-1 text-gray-500 hover:text-blue-600"
                                title="Add progress"
                              >
                                <PlusCircleIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTodayTask(task);
                                  setAddTodayTaskModalOpen(true);
                                }}
                                className="p-1 text-gray-500 hover:text-indigo-600"
                                title="Edit task"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResetTodayDailyTask(task.id);
                                }}
                                className="p-1 text-gray-500 hover:text-orange-600"
                                title="Reset progress to 0"
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTodayDailyTask(task.id);
                                }}
                                className="p-1 text-gray-500 hover:text-red-600"
                                title="Delete task"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className={`${barColor} h-3 rounded-full transition-all duration-500 ease-out`}
                                style={{
                                  width: `${percent > 100 ? 100 : percent}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-mono text-indigo-600 font-semibold min-w-[60px] text-right">
                            {percent.toFixed(2)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {task.type === "course"
                            ? `${progressDisplay} of ${totalDisplay} completed`
                            : task.type === "book"
                            ? `${progressDisplay} of ${totalDisplay} pages completed`
                            : task.type === "day"
                            ? `${progressDisplay} of ${totalDisplay} days completed`
                            : `${progressDisplay} of ${totalDisplay} completed`}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Use external modal components */}
          <AddTodayTaskModal
            isOpen={addTodayTaskModalOpen}
            onClose={() => setAddTodayTaskModalOpen(false)}
            onSave={handleSaveTodayTaskFromModal}
            editingTask={editingTodayTask}
          />

          <AddTodayProgressModal
            isOpen={addTodayProgressModalOpen}
            onClose={() => {
              setAddTodayProgressModalOpen(false);
              setSelectedTodayTask(null);
            }}
            onSave={handleAddTodayProgressFromModal}
            task={selectedTodayTask}
          />
        </section>
      </>
    );
  };

  // Handle login - show LoginPage if no userId
  const handleLoginSuccess = (newUserId, userName) => {
    setUserId(newUserId);
    localStorage.setItem("userId", newUserId);
    localStorage.setItem("userName", userName);
    window.location.reload(); // Reload to initialize all data
  };

  if (!userId) {
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <p className="text-lg text-gray-600">Loading Your Roadmap...</p>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset All Progress"
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to reset ALL progress? This action cannot be
          undone.
        </p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setResetModalOpen(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmReset}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </Modal>
      <StatisticsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        stats={aggregatedStats}
      />
      <MasterAddTimeModal
        isOpen={masterAddTimeModalOpen}
        onClose={() => setMasterAddTimeModalOpen(false)}
        onSaveTime={handleMasterAddTime}
        onSavePages={handleMasterAddPages}
        roadmap={roadmap}
      />
      <AddNewWeeklyTaskModal
        isOpen={newWeeklyTaskModal.isOpen}
        onClose={() =>
          setNewWeeklyTaskModal({ isOpen: false, weekNumber: null })
        }
        onSave={(data) =>
          handleAddWeeklyTask(newWeeklyTaskModal.weekNumber, data)
        }
      />
      <AddSpanningTaskModal
        isOpen={spanningTaskModalOpen}
        onClose={() => setSpanningTaskModalOpen(false)}
        onSave={handleAddSpanningTask}
      />
      <AddWeeksModal
        isOpen={addWeeksModalOpen}
        onClose={() => setAddWeeksModalOpen(false)}
        onSave={handleAddWeeks}
      />

      <WeeklyProgressModal
        isOpen={weeklyProgressModalOpen}
        onClose={() => setWeeklyProgressModalOpen(false)}
        onSave={handleWeeklyProgressFromModal}
        task={selectedWeeklyTask}
      />

      {/* Floating Pomodoro Timer Button */}
      <button
        onClick={handlePomodoroIconClick}
        className={`fixed bottom-20 right-6 text-white p-4 rounded-full shadow-lg transition-all z-40 flex items-center gap-2 ${
          pomodoroState.isRunning
            ? "bg-green-500 hover:bg-green-600 animate-pulse"
            : "bg-red-500 hover:bg-red-600"
        }`}
        title={
          pomodoroState.isRunning
            ? "Timer Running - Click to open"
            : "Pomodoro Timer"
        }
      >
        <Clock size={24} />
        {pomodoroState.isRunning && (
          <span className="text-xs font-bold bg-white text-green-600 px-2 py-1 rounded-full">
            {Math.floor(pomodoroState.timeLeft / 60)}:
            {String(pomodoroState.timeLeft % 60).padStart(2, "0")}
          </span>
        )}
      </button>

      {/* Pomodoro Timer Modal */}
      {showPomodoroTimer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 pb-24">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Pomodoro Timer
              </h3>
              <button
                onClick={handlePomodoroModalClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <PomodoroTimer
              onTimerStateChange={handlePomodoroStateChange}
              initialState={pomodoroState}
            />
          </div>
        </div>
      )}

      {/* Minimized Pomodoro Timer Icon - Hidden */}
      {/* {pomodoroMinimized && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={handlePomodoroIconClick}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <ClockIcon className="w-6 h-6" />
          </button>
        </div>
      )} */}

      {/* Goal Modal */}
      <AddGoalModal
        isOpen={addGoalModalOpen}
        onClose={() => setAddGoalModalOpen(false)}
        onAdd={(goalData) => {
          const newGoal = {
            ...goalData,
            id: `goal-${Date.now()}`,
            createdAt: new Date().toISOString(),
            progress: 0,
          };
          setGoals((prev) => [...prev, newGoal]);
          setAddGoalModalOpen(false);
        }}
      />

      {/* Toast Notifications */}
      <CustomToaster />

      {/* Hidden Audio Element for Timer Completion */}
      <audio ref={timerAudioRef} preload="auto">
        <source src={DigitalTimerSound} type="audio/mpeg" />
      </audio>

      {/* Main Layout */}
      <div className="min-h-screen bg-gray-50 font-sans pb-20">
        <div className="max-w-3xl mx-auto px-2 sm:px-6 lg:px-8 py-6">
          {/* Header with Profile */}
          <header className="flex flex-row justify-between items-center mb-6 gap-4 w-full">
            <div className="flex flex-row items-center gap-3 flex-1">
              <img
                src={Logo}
                alt="Progress Tracker Logo"
                className="w-9 h-9 object-contain"
              />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Progress Tracker
              </h1>
            </div>
            <ProfileMenuModern
              onImport={handleImport}
              onExport={handleExport}
              onOpenStats={() => setStatsModalOpen(true)}
              isSyncing={isSyncing}
              lastSyncTime={lastSyncTime}
            />
          </header>

          {/* Section Content */}
          {activeSection === "home" && (
            <>
              <QuoteSection
                quote={quotes[quoteIndex]}
                onClick={handleNextQuote}
              />

              <TodayTasksSection
                tasks={todayTasks}
                completedOneTimeTasks={completedOneTimeTasks}
                skippedTasks={skippedTasks}
                onAddTask={handleAddTodayTask}
                onToggleTask={handleToggleTodayTask}
                onDeleteTask={handleDeleteTodayTask}
                onEditTask={handleEditTodayTask}
                onSkipTask={handleSkipTask}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                filterType={filterType}
                onFilterChange={setFilterType}
                sortType={sortType}
                onSortChange={setSortType}
              />

              {/* Records Section - Last 7 Days */}
              <RecordsSection
                records={dailyRecords}
                todayTasks={todayTasks}
                completedOneTimeTasks={completedOneTimeTasks}
                skippedTasks={skippedTasks}
              />
            </>
          )}
          {activeSection === "books" && (
            <>
              <div className="mb-6">
                <CountdownTimer />
              </div>
              <TodaySection />
            </>
          )}
          {activeSection === "progress" && roadmap && (
            <>
              <div className="mb-6">
                <CountdownTimer />
              </div>
              <div className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl p-8 mb-8 shadow-xl border-2 border-white/50 relative overflow-hidden">
                {/* Decorative blur elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl -z-10"></div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex-1 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Overall Progress
                    </h2>
                    <span className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 ml-4 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
                      {overallProgress.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="mt-6">
                  <ProgressBar percentage={overallProgress} />
                </div>
              </div>
            </>
          )}
          {activeSection === "progress" &&
            roadmap &&
            roadmap.phases &&
            roadmap.phases.map((phase, phaseIndex) => (
              <section key={phaseIndex} className="mb-10">
                <div className="mb-6 flex justify-between items-center gap-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-xl">
                  <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                      {phase.phase}
                    </h2>
                    <p className="text-white/90 mt-2 text-base font-medium">
                      {phase.duration}
                    </p>
                  </div>
                  <button
                    onClick={() => setSpanningTaskModalOpen(true)}
                    className="bg-white text-indigo-600 font-bold px-4 sm:px-6 py-3 rounded-xl hover:shadow-xl transition-all flex items-center text-sm flex-shrink-0 hover:scale-105"
                  >
                    <PlusCircleIcon className="w-5 h-5 sm:mr-2" />
                    <span className="hidden sm:inline">
                      Add Multi-Week Task
                    </span>
                  </button>
                </div>
                {phase.weeks
                  .filter((week) => calculateWeekProgress(week) < 100)
                  .map((week, index, filteredWeeks) => (
                    <Week
                      key={week.week}
                      weekData={{
                        ...week,
                        weekInfo: getWeekInfo(week.week, roadmap.startDate),
                      }}
                      onDeleteTask={handleDeleteRoadmapTask}
                      onEditTask={handleEditRoadmapTask}
                      onRenameTitle={handleRenameWeekTitle}
                      isCurrentWeek={week.week === currentWeekNumber}
                      isFirstVisibleWeek={index === 0}
                      onOpenNewTaskModal={openNewTaskModal}
                      onOpenProgressModal={openProgressModal}
                    />
                  ))}
              </section>
            ))}
          {activeSection === "progress" && !roadmap && (
            <div className="text-center py-16 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-white/50 relative overflow-hidden">
              {/* Decorative blur elements */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl -z-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl -z-10"></div>

              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                No Weekly Progress
              </h2>
              <p className="text-gray-600 mt-3 mb-8 text-lg font-medium">
                Get started by adding a new weekly plan.
              </p>
              <button
                onClick={() => setAddWeeksModalOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center mx-auto"
              >
                <PlusCircleIcon className="w-6 h-6 mr-3" />
                Add Weeks
              </button>
            </div>
          )}
          {activeSection === "analytics" && (
            <div className="space-y-8">
              {/* Time Left Section */}
              <CountdownTimer />
              {/* Pomodoro Statistics Section - Only analytics content */}
              <PomodoroAnalytics />
            </div>
          )}
          {activeSection === "profile" && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-6">
                  <img
                    src={Profile}
                    alt="Profile"
                    className="w-20 h-20 rounded-full border-4 border-white/20 object-cover"
                  />
                  <div>
                    <h2 className="text-3xl font-bold">Rahat</h2>
                    <p className="text-indigo-100 text-lg">
                      Dedicated Student & Learner
                    </p>
                    <p className="text-indigo-200 text-sm mt-1">
                      Member since {new Date().getFullYear()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {todayTasks.filter((task) => task.completed).length}
                  </h3>
                  <p className="text-gray-600">Tasks Completed</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpenIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {Object.values(aggregatedStats.books).reduce(
                      (sum, pages) => sum + pages,
                      0
                    )}
                  </h3>
                  <p className="text-gray-600">Pages Read</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {Object.values(aggregatedStats.challenges).reduce(
                      (sum, days) => sum + days,
                      0
                    )}
                  </h3>
                  <p className="text-gray-600">Challenge Days</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClockIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      Object.values(aggregatedStats.courses).reduce(
                        (sum, minutes) => sum + minutes,
                        0
                      ) / 60
                    )}
                    h
                  </h3>
                  <p className="text-gray-600">Study Hours</p>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🏆 Achievements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Task Master
                      </h4>
                      <p className="text-sm text-gray-600">
                        Completed{" "}
                        {todayTasks.filter((task) => task.completed).length}{" "}
                        tasks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <span className="text-2xl">📚</span>
                    <div>
                      <h4 className="font-semibold text-gray-800">Bookworm</h4>
                      <p className="text-sm text-gray-600">
                        Reading {books.length} books
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Consistency King
                      </h4>
                      <p className="text-sm text-gray-600">
                        {
                          todayTasks.filter(
                            (task) => task.repeatType === "daily"
                          ).length
                        }{" "}
                        daily habits
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Priority Focus
                      </h4>
                      <p className="text-sm text-gray-600">
                        {
                          todayTasks.filter((task) => task.priority === "high")
                            .length
                        }{" "}
                        high priority tasks
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings & Actions */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Settings & Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setStatsModalOpen(true)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <BarChart2Icon className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium">
                      View Detailed Statistics
                    </span>
                  </button>
                  <button
                    onClick={handleExport}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <span className="text-lg">📤</span>
                    <span className="font-medium">Export My Data</span>
                  </button>
                  <button
                    onClick={handleImport}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <span className="text-lg">📥</span>
                    <span className="font-medium">Import Data</span>
                  </button>
                  <button
                    onClick={() => setResetModalOpen(true)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 rounded-xl transition-colors text-red-600"
                  >
                    <span className="text-lg">🗑️</span>
                    <span className="font-medium">Reset All Data</span>
                  </button>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Connect With Me
                </h3>
                <div className="flex justify-center gap-4">
                  <a
                    href="https://www.linkedin.com/in/md-rabbi-hossen-rabbi-b1bbb0326/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </a>
                  <a
                    href="https://github.com/md-rabbihossen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-gray-900 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                  <a
                    href="mailto:rabbihossenrabbi24@gmail.com"
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M0 3v18h24V3H0zm21.518 2L12 12.713 2.482 5h19.036zM2 19V7.183l10 8.104 10-8.104V19H2z" />
                    </svg>
                    Email
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-gray-500 text-sm">
                © 2025 Progress Tracker. Made with ❤️ by Md Rahat Hossen
              </div>
            </div>
          )}
        </div>

        {/* Modern Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg flex justify-around items-center h-16 px-2 sm:px-8">
          <button
            className={`flex flex-col items-center flex-1 py-2 ${
              activeSection === "home"
                ? "text-indigo-600"
                : "text-gray-400 hover:text-indigo-500"
            }`}
            onClick={() => handleNavigationClick("home")}
          >
            {" "}
            <HomeIcon className="w-6 h-6 mb-1" />{" "}
            <span className="text-xs font-medium">Home</span>{" "}
          </button>
          <button
            className={`flex flex-col items-center flex-1 py-2 ${
              activeSection === "progress"
                ? "text-indigo-600"
                : "text-gray-400 hover:text-indigo-500"
            }`}
            onClick={() => handleNavigationClick("progress")}
          >
            {" "}
            <BarChart2Icon className="w-6 h-6 mb-1" />{" "}
            <span className="text-xs font-medium">Progress</span>{" "}
          </button>
          <button
            className={`flex flex-col items-center flex-1 py-2 ${
              activeSection === "books"
                ? "text-indigo-600"
                : "text-gray-400 hover:text-indigo-500"
            }`}
            onClick={() => handleNavigationClick("books")}
          >
            {" "}
            <BookOpenIcon className="w-6 h-6 mb-1" />{" "}
            <span className="text-xs font-medium">Track</span>{" "}
          </button>
          <button
            className={`flex flex-col items-center flex-1 py-2 ${
              activeSection === "analytics"
                ? "text-indigo-600"
                : "text-gray-400 hover:text-indigo-500"
            }`}
            onClick={() => handleNavigationClick("analytics")}
          >
            {" "}
            <BarChart2Icon className="w-6 h-6 mb-1" />{" "}
            <span className="text-xs font-medium">Analytics</span>{" "}
          </button>
          <button
            className={`flex flex-col items-center flex-1 py-2 ${
              activeSection === "profile"
                ? "text-indigo-600"
                : "text-gray-400 hover:text-indigo-500"
            }`}
            onClick={() => handleNavigationClick("profile")}
          >
            {" "}
            <UserCircleIcon className="w-6 h-6 mb-1" />{" "}
            <span className="text-xs font-medium">Profile</span>{" "}
          </button>
        </nav>
      </div>
    </>
  );
}

// --- New Modal Components ---

function StatisticsModal({ isOpen, onClose, stats }) {
  const [activeTab, setActiveTab] = useState("overview");

  const totalCoursesTime = Object.values(stats.courses).reduce(
    (sum, minutes) => sum + minutes,
    0
  );
  const totalPagesRead = Object.values(stats.books).reduce(
    (sum, pages) => sum + pages,
    0
  );
  const totalCourses = Object.keys(stats.courses).length;
  const totalBooks = Object.keys(stats.books).length;

  const formatTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getTopItems = (items, limit = 5) => {
    return Object.entries(items)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <BarChart2Icon className="w-6 h-6 text-indigo-600" />
          Statistics Dashboard
        </div>
      }
    >
      <div className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "overview"
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "courses"
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab("books")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "books"
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Books
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Study Time</p>
                    <p className="text-2xl font-bold">
                      {formatTime(totalCoursesTime)}
                    </p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Pages Read</p>
                    <p className="text-2xl font-bold">{totalPagesRead}</p>
                  </div>
                  <BookOpenIcon className="w-8 h-8 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Active Courses</p>
                    <p className="text-2xl font-bold">{totalCourses}</p>
                  </div>
                  <BarChart2Icon className="w-8 h-8 text-purple-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Books Reading</p>
                    <p className="text-2xl font-bold">{totalBooks}</p>
                  </div>
                  <BookOpenIcon className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Quick Facts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Average study time per course:
                  </span>
                  <span className="font-medium">
                    {totalCourses > 0
                      ? formatTime(Math.round(totalCoursesTime / totalCourses))
                      : "0h 0m"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average pages per book:</span>
                  <span className="font-medium">
                    {totalBooks > 0
                      ? Math.round(totalPagesRead / totalBooks)
                      : 0}{" "}
                    pages
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Most productive time investment:
                  </span>
                  <span className="font-medium text-indigo-600">
                    {totalCoursesTime > totalPagesRead * 2
                      ? "Course Study"
                      : "Reading"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Course Progress
              </h3>
              <div className="text-sm text-gray-500">
                Total: {formatTime(totalCoursesTime)}
              </div>
            </div>
            {Object.keys(stats.courses).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart2Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No course data available yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getTopItems(stats.courses, 10).map(
                  ([name, minutes], index) => {
                    const hours = (minutes / 60).toFixed(1);
                    const percentage =
                      totalCoursesTime > 0
                        ? (minutes / totalCoursesTime) * 100
                        : 0;
                    return (
                      <div
                        key={name}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <h4 className="font-medium text-gray-800">
                              {name}
                            </h4>
                          </div>
                          <span className="text-sm font-semibold text-indigo-600">
                            {hours}h
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {percentage.toFixed(1)}% of total study time
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}

        {/* Books Tab */}
        {activeTab === "books" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Reading Progress
              </h3>
              <div className="text-sm text-gray-500">
                Total: {totalPagesRead} pages
              </div>
            </div>
            {Object.keys(stats.books).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpenIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No reading data available yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getTopItems(stats.books, 10).map(([name, pages], index) => {
                  const percentage =
                    totalPagesRead > 0 ? (pages / totalPagesRead) * 100 : 0;
                  return (
                    <div
                      key={name}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                          <h4 className="font-medium text-gray-800">{name}</h4>
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                          {pages} pages
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {percentage.toFixed(1)}% of total pages read
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function MasterAddTimeModal({
  isOpen,
  onClose,
  onSaveTime,
  onSavePages,
  roadmap,
}) {
  const [mode, setMode] = useState("time"); // 'time' or 'pages'
  const [selectedTaskName, setSelectedTaskName] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [pages, setPages] = useState("");

  const availableTimeTasks = useMemo(() => {
    if (!roadmap || !roadmap.phases) return [];
    const taskSet = new Set();
    roadmap.phases.forEach((p) => {
      if (!p.weeks) return;
      p.weeks.forEach((w) => {
        if (!w.topics) return;
        w.topics.forEach((t) => {
          if (t.type !== "book" && (t.completedMinutes || 0) < t.totalMinutes) {
            taskSet.add(t.text);
          }
        });
      });
    });
    console.log("⏰ Available time tasks:", Array.from(taskSet));
    return Array.from(taskSet);
  }, [roadmap]);

  const availableBookTasks = useMemo(() => {
    if (!roadmap || !roadmap.phases) return [];
    const taskSet = new Set();
    roadmap.phases.forEach((p) => {
      if (!p.weeks) return;
      p.weeks.forEach((w) => {
        if (!w.topics) return;
        w.topics.forEach((t) => {
          if (t.type === "book" && (t.completedPages || 0) < t.totalPages) {
            taskSet.add(t.text);
          }
        });
      });
    });
    console.log("📚 Available book tasks:", Array.from(taskSet));
    return Array.from(taskSet);
  }, [roadmap]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("🚀 MasterAddTimeModal submit:", {
      mode,
      selectedTaskName,
      hours,
      minutes,
      pages,
    });
    if (selectedTaskName) {
      if (mode === "time") {
        console.log("⏰ Calling onSaveTime");
        onSaveTime(selectedTaskName, hours, minutes);
      } else {
        console.log("📚 Calling onSavePages");
        onSavePages(selectedTaskName, pages);
      }
    } else {
      console.log("❌ No task selected");
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedTaskName("");
      setHours("");
      setMinutes("");
      setPages("");
    } else {
      setMode("time");
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Completed Progress">
      <div className="flex items-center border-b border-gray-200 mb-4">
        <button
          onClick={() => {
            setMode("time");
            setSelectedTaskName("");
          }}
          className={`px-4 py-2 text-sm font-medium ${
            mode === "time"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Add Time
        </button>
        <button
          onClick={() => {
            setMode("pages");
            setSelectedTaskName("");
          }}
          className={`px-4 py-2 text-sm font-medium ${
            mode === "pages"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Add Pages
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        {mode === "time" ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="task-select-time"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Task
              </label>
              <select
                id="task-select-time"
                value={selectedTaskName}
                onChange={(e) => setSelectedTaskName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="" disabled>
                  Choose a task...
                </option>
                {availableTimeTasks.map((taskName) => (
                  <option key={taskName} value={taskName}>
                    {taskName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time to Add
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Hours"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  min="0"
                />
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="Minutes"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  min="0"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="task-select-book"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Book
              </label>
              <select
                id="task-select-book"
                value={selectedTaskName}
                onChange={(e) => setSelectedTaskName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="" disabled>
                  Choose a book...
                </option>
                {availableBookTasks.map((taskName) => (
                  <option key={taskName} value={taskName}>
                    {taskName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="pages-read"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pages Read
              </label>
              <input
                id="pages-read"
                type="number"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="e.g., 50"
                className="w-full p-2 border border-gray-300 rounded-lg"
                min="1"
              />
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add Progress
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Modern ProfileMenu with avatar and dropdown (localStorage-only version)
function ProfileMenuModern({
  onImport,
  onExport,
  onOpenStats,
  isSyncing,
  lastSyncTime,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const userName = localStorage.getItem("userName") || "User";
  const userId = localStorage.getItem("userId") || "";

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const copyUserId = () => {
    navigator.clipboard.writeText(userId);
    alert("User ID copied to clipboard!");
  };

  return (
    <>
      <div className="relative flex flex-col items-center ml-2">
        <button
          ref={buttonRef}
          className="rounded-full border-2 border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          onClick={() => setOpen((o) => !o)}
          aria-label="Profile menu"
        >
          <img
            src={Profile}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
        </button>
        {open && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4 text-left flex flex-col animate-fade-in"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src={Profile}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-base">
                  {userName}
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  ID: {userId.substring(0, 8)}...
                  <button
                    onClick={copyUserId}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    Copy
                  </button>
                </div>
                <SyncStatusIndicator
                  isSyncing={isSyncing}
                  lastSyncTime={lastSyncTime}
                />
              </div>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                onOpenStats();
              }}
              className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
            >
              Statistics
            </button>
            <button
              onClick={() => {
                onImport();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
            >
              Import Data
            </button>
            <button
              onClick={() => {
                onExport();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
            >
              Export Data
            </button>

            <div className="border-t border-gray-100 my-2"></div>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to logout?")) {
                  handleLogout();
                }
              }}
              className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium"
            >
              Logout
            </button>

            <div className="border-t border-gray-100 my-2"></div>
            <div className="flex justify-center space-x-3 mb-2">
              <a
                href="https://www.linkedin.com/in/md-rabbi-hossen-rabbi-b1bbb0326/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://github.com/md-rabbihossen"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-800 hover:text-gray-900"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="mailto:rabbihossenrabbi24@gmail.com"
                className="text-red-500 hover:text-red-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M0 3v18h24V3H0zm21.518 2L12 12.713 2.482 5h19.036zM2 19V7.183l10 8.104 10-8.104V19H2z" />
                </svg>
              </a>
            </div>
            <div className="mt-auto text-center text-gray-600 font-semibold text-xs p-1">
              © 2025 Progress Tracker (Local Storage)
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function AddNewWeeklyTaskModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("course");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [pages, setPages] = useState("");
  const [days, setDays] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    let taskData;
    if (type === "course") {
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      if (h === 0 && m === 0) return;

      taskData = {
        name: name.trim(),
        type: type,
        hours: h,
        minutes: m,
      };
    } else if (type === "book") {
      const p = parseInt(pages) || 0;
      if (p <= 0) return;

      taskData = {
        name: name.trim(),
        type: type,
        pages: p,
      };
    } else if (type === "day") {
      const d = parseInt(days) || 0;
      if (d <= 0) return;

      taskData = {
        name: name.trim(),
        type: type,
        days: d,
      };
    } else if (type === "simple") {
      taskData = {
        name: name.trim(),
        type: type,
        completed: false, // Simple tasks start as incomplete
      };
    }

    if (name.trim()) {
      onSave(taskData);
      setName("");
      setType("course");
      setHours("");
      setMinutes("");
      setPages("");
      setDays("");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setType("course");
      setHours("");
      setMinutes("");
      setPages("");
      setDays("");
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Weekly Task">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="task-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Task Name
            </label>
            <input
              type="text"
              id="task-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Learn Redux"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
            >
              <option value="course">Course (Time)</option>
              <option value="book">Book (Pages)</option>
              <option value="day">Challenge (Days)</option>
              <option value="simple">Simple Task (Checkbox)</option>
            </select>
          </div>
          {type === "course" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Time
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="Hours"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="Minutes"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    min="0"
                    max="59"
                  />
                </div>
              </div>
            </div>
          ) : type === "book" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Pages
              </label>
              <input
                type="number"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="Number of pages"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                min="1"
              />
            </div>
          ) : type === "day" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Days
              </label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="e.g., 50 for 50-day challenge"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                min="1"
              />
            </div>
          ) : type === "simple" ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 border-2 border-blue-400 rounded bg-white"></div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">
                    Simple Task
                  </h4>
                  <p className="text-xs text-blue-600 mt-1">
                    This will create a simple checkbox task that can be marked
                    as complete/incomplete, similar to the "Today's Tasks"
                    section.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddSpanningTaskModal({ isOpen, onClose, onSave }) {
  const [mode, setMode] = useState("task"); // 'task', 'book', or 'day'
  const [name, setName] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [pages, setPages] = useState("");
  const [days, setDays] = useState("");
  const [numWeeks, setNumWeeks] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && numWeeks > 0) {
      if (mode === "task") {
        onSave({ type: "time", name: name.trim(), hours, minutes, numWeeks });
      } else if (mode === "book") {
        onSave({ type: "book", name: name.trim(), pages, numWeeks });
      } else if (mode === "day") {
        onSave({ type: "day", name: name.trim(), days, numWeeks });
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setHours("");
      setMinutes("");
      setPages("");
      setDays("");
      setNumWeeks("");
      setMode("task");
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Multi-Week Item">
      <div className="flex items-center border-b border-gray-200 mb-4">
        <button
          onClick={() => setMode("task")}
          className={`px-4 py-2 text-sm font-medium ${
            mode === "task"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Task
        </button>
        <button
          onClick={() => setMode("book")}
          className={`px-4 py-2 text-sm font-medium ${
            mode === "book"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Book
        </button>
        <button
          onClick={() => setMode("day")}
          className={`px-4 py-2 text-sm font-medium ${
            mode === "day"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Challenge
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="spanning-task-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {mode === "task" ? "Task Name" : "Challenge Name"}
            </label>
            <input
              type="text"
              id="spanning-task-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                mode === "task"
                  ? "e.g., Master a New Skill"
                  : "e.g., Atomic Habit"
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
              autoFocus
              required
            />
          </div>

          {mode === "task" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Time for Task
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Hours"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  min="0"
                />
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="Minutes"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  min="0"
                  max="59"
                />
              </div>
            </div>
          ) : mode === "book" ? (
            <div>
              <label
                htmlFor="total-pages"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Total Number of Pages
              </label>
              <input
                type="number"
                id="total-pages"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="e.g., 350"
                className="w-full p-2 border border-gray-300 rounded-lg"
                min="1"
                required
              />
            </div>
          ) : mode === "day" ? (
            <div>
              <label
                htmlFor="total-days"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Total Number of Days
              </label>
              <input
                type="number"
                id="total-days"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="e.g., 50 for 50-day challenge"
                className="w-full p-2 border border-gray-300 rounded-lg"
                min="1"
                required
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor="num-weeks"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Distribute Over How Many Weeks?
            </label>
            <input
              type="number"
              id="num-weeks"
              value={numWeeks}
              onChange={(e) => setNumWeeks(e.target.value)}
              placeholder="e.g., 4"
              className="w-full p-2 border border-gray-300 rounded-lg"
              min="1"
              required
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add to Roadmap
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddWeeksModal({ isOpen, onClose, onSave }) {
  const [numWeeks, setNumWeeks] = useState("");
  const [startDate, setStartDate] = useState(getDateString());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (numWeeks > 0 && startDate) {
      onSave({ numWeeks, startDate });
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setNumWeeks("");
      setStartDate(getDateString());
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Weekly Plan">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="new-num-weeks"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Number of Weeks
            </label>
            <input
              type="number"
              id="new-num-weeks"
              value={numWeeks}
              onChange={(e) => setNumWeeks(e.target.value)}
              placeholder="e.g., 12"
              className="w-full p-2 border border-gray-300 rounded-lg"
              min="1"
              required
              autoFocus
            />
          </div>
          <div>
            <label
              htmlFor="start-date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Date
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add Plan
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Add Today Task Modal Component
function AddTodayTaskModal({ isOpen, onClose, onSave, editingTask }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("course");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [currentHours, setCurrentHours] = useState("");
  const [currentMinutes, setCurrentMinutes] = useState("");
  const [pages, setPages] = useState("");
  const [currentPages, setCurrentPages] = useState("");
  const [days, setDays] = useState("");
  const [currentDays, setCurrentDays] = useState("");

  useEffect(() => {
    if (editingTask) {
      setName(editingTask.name);
      setType(editingTask.type);
      if (editingTask.type === "course") {
        setHours((editingTask.totalHours || 0).toString());
        setMinutes((editingTask.totalMinutes || 0).toString());
        setCurrentHours((editingTask.progressHours || 0).toString());
        setCurrentMinutes((editingTask.progressMinutes || 0).toString());
        setPages("");
        setCurrentPages("");
        setDays("");
        setCurrentDays("");
      } else if (editingTask.type === "book") {
        setHours("");
        setMinutes("");
        setCurrentHours("");
        setCurrentMinutes("");
        setPages((editingTask.total || 0).toString());
        setCurrentPages((editingTask.progress || 0).toString());
        setDays("");
        setCurrentDays("");
      } else if (editingTask.type === "day") {
        setHours("");
        setMinutes("");
        setCurrentHours("");
        setCurrentMinutes("");
        setPages("");
        setCurrentPages("");
        setDays((editingTask.total || 0).toString());
        setCurrentDays((editingTask.progress || 0).toString());
      }
    } else {
      setName("");
      setType("course");
      setHours("");
      setMinutes("");
      setCurrentHours("");
      setCurrentMinutes("");
      setPages("");
      setCurrentPages("");
      setDays("");
      setCurrentDays("");
    }
  }, [editingTask, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    let taskData;
    if (type === "course") {
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      const ch = parseInt(currentHours) || 0;
      const cm = parseInt(currentMinutes) || 0;
      if (h === 0 && m === 0) return;

      // Convert minutes > 59 to hours and remaining minutes
      const totalMinutes = h * 60 + m;
      const finalHours = Math.floor(totalMinutes / 60);
      const finalMinutes = totalMinutes % 60;

      // Convert current minutes > 59 to hours and remaining minutes
      const currentTotalMinutes = ch * 60 + cm;
      const finalCurrentHours = Math.floor(currentTotalMinutes / 60);
      const finalCurrentMinutes = currentTotalMinutes % 60;

      // Ensure current time doesn't exceed total time
      const maxCurrentMinutes = finalHours * 60 + finalMinutes;
      const validCurrentMinutes = Math.min(
        currentTotalMinutes,
        maxCurrentMinutes
      );
      const validCurrentHours = Math.floor(validCurrentMinutes / 60);
      const validCurrentMinutesRemainder = validCurrentMinutes % 60;

      taskData = {
        name: name.trim(),
        type: type,
        totalHours: finalHours,
        totalMinutes: finalMinutes,
        progressHours: validCurrentHours,
        progressMinutes: validCurrentMinutesRemainder,
      };
    } else if (type === "book") {
      const p = parseInt(pages) || 0;
      const cp = parseInt(currentPages) || 0;
      if (p <= 0) return;

      // Ensure current pages doesn't exceed total pages
      const validCurrentPages = Math.min(cp, p);

      taskData = {
        name: name.trim(),
        type: type,
        total: p,
        progress: validCurrentPages,
      };
    } else if (type === "day") {
      const d = parseInt(days) || 0;
      const cd = parseInt(currentDays) || 0;
      if (d <= 0) return;

      // Ensure current days doesn't exceed total days
      const validCurrentDays = Math.min(cd, d);

      taskData = {
        name: name.trim(),
        type: type,
        total: d,
        progress: validCurrentDays,
      };
    }

    if (name.trim()) {
      onSave(taskData);
      setName("");
      setType("course");
      setHours("");
      setMinutes("");
      setCurrentHours("");
      setCurrentMinutes("");
      setPages("");
      setCurrentPages("");
      setDays("");
      setCurrentDays("");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? "Edit Task" : "Add Progress Task"}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="today-task-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Task Name
            </label>
            <input
              type="text"
              id="today-task-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Learn React"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
            >
              <option value="book">Book (Pages)</option>
              <option value="course">Course (Time)</option>
              <option value="day">Challenge (Days)</option>
            </select>
          </div>
          {type === "course" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Time
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="Hours"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                      min="0"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      placeholder="Minutes"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Time Completed
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={currentHours}
                      onChange={(e) => setCurrentHours(e.target.value)}
                      placeholder="Hours"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                      min="0"
                      max={hours || undefined}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={currentMinutes}
                      onChange={(e) => setCurrentMinutes(e.target.value)}
                      placeholder="Minutes"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                      min="0"
                      max="59"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : type === "book" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Pages
                </label>
                <input
                  type="number"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  placeholder="Number of pages"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Pages Read
                </label>
                <input
                  type="number"
                  value={currentPages}
                  onChange={(e) => setCurrentPages(e.target.value)}
                  placeholder="Pages already read"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                  min="0"
                  max={pages || undefined}
                />
              </div>
            </div>
          ) : type === "day" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Days
                </label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="e.g., 50 for 50-day challenge"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Days Completed
                </label>
                <input
                  type="number"
                  value={currentDays}
                  onChange={(e) => setCurrentDays(e.target.value)}
                  placeholder="Days already completed"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                  min="0"
                  max={days || undefined}
                />
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {editingTask ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Add Today Progress Modal Component
function AddTodayProgressModal({ isOpen, onClose, onSave, task }) {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [pages, setPages] = useState("");
  const [days, setDays] = useState("");

  useEffect(() => {
    if (!isOpen || !task) {
      setHours("");
      setMinutes("");
      setPages("");
      setDays("");
    }
  }, [isOpen, task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task) return;

    let progressData = { taskId: task.id };

    if (task.type === "book") {
      const p = parseInt(pages) || 0;
      if (p <= 0) return;
      progressData.pages = p;
    } else if (task.type === "day") {
      const d = parseInt(days) || 0;
      if (d <= 0) return;
      progressData.days = d;
    } else {
      // Course type - handle time
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      if (h === 0 && m === 0) return;

      progressData.hours = h;
      progressData.minutes = m;
    }

    onSave(progressData);
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Progress - ${task.name}`}
    >
      <form onSubmit={handleSubmit}>
        {task.type === "book" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pages Read
              </label>
              <input
                type="number"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="Number of pages"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                min="1"
                autoFocus
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Current: {task.progress || 0} / {task.total || 0} pages
              </p>
            </div>
          </div>
        ) : task.type === "day" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days Completed
              </label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="Number of days"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                min="1"
                autoFocus
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Current: {task.progress || 0} / {task.total || 0} days completed
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Spent
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="Hours"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                    min="0"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="Minutes"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                    min="0"
                    autoFocus
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Current: {task.progressHours || 0}h {task.progressMinutes || 0}m
                / {task.totalHours || 0}h {task.totalMinutes || 0}m
              </p>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add Progress
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Weekly Progress Modal Component
function WeeklyProgressModal({ isOpen, onClose, onSave, task }) {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [pages, setPages] = useState("");
  const [days, setDays] = useState("");

  useEffect(() => {
    if (!isOpen || !task) {
      setHours("");
      setMinutes("");
      setPages("");
      setDays("");
    }
  }, [isOpen, task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task) return;

    let progressData = { taskId: task.id };

    if (task.type === "book") {
      const p = parseInt(pages) || 0;
      if (p <= 0) return;
      progressData.pages = p;
    } else if (task.type === "day") {
      const d = parseInt(days) || 0;
      if (d <= 0) return;
      progressData.days = d;
    } else {
      // Course type - handle time
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      if (h === 0 && m === 0) return;

      // Convert to total minutes for storage
      const totalMinutes = h * 60 + m;
      progressData.minutes = totalMinutes;
    }

    onSave(progressData);
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Progress - ${task.text}`}
    >
      <form onSubmit={handleSubmit}>
        {task.type === "book" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pages Read
              </label>
              <input
                type="number"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="Number of pages"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                min="1"
                autoFocus
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Current: {task.completedPages || 0} / {task.totalPages || 0}{" "}
                pages
              </p>
            </div>
          </div>
        ) : task.type === "day" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days Completed
              </label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="Number of days"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                min="1"
                autoFocus
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Current: {task.completedDays || 0} / {task.totalDays || 0} days
                completed
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Spent
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="Hours"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                    min="0"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="Minutes"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                    min="0"
                    autoFocus
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Current: {Math.floor((task.completedMinutes || 0) / 60)}h{" "}
                {(task.completedMinutes || 0) % 60}m /{" "}
                {Math.floor((task.totalMinutes || 0) / 60)}h{" "}
                {(task.totalMinutes || 0) % 60}m
              </p>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add Progress
          </button>
        </div>
      </form>
    </Modal>
  );
}
