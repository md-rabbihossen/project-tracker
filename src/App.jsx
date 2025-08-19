import { useEffect, useMemo, useRef, useState } from "react";
import Logo from "./assets/logo.png";
import Profile from "./assets/profile.jpg";

// Import components
import {
  ArrowPathIcon,
  BarChart2Icon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  HomeIcon,
  PencilIcon,
  PlusCircleIcon,
  TrashIcon,
  UserCircleIcon,
} from "./components/Icons";

import { LoginModal } from "./components/auth/LoginModal";
import { RegisterModal } from "./components/auth/RegisterModal";
import { ProgressCharts } from "./components/charts/ProgressCharts";
import { MobileFilter } from "./components/common/MobileFilter";
import { Modal } from "./components/common/Modal";
import { ProgressBar } from "./components/common/ProgressBar";
import { AddTaskForm } from "./components/forms/AddTaskForm";
import { AddGoalModal, GoalCard } from "./components/goals/GoalComponents";
import { CustomToaster } from "./components/notifications/ToastNotifications";
import { CountdownTimer } from "./components/sections/CountdownTimer";
import { PomodoroTimer } from "./components/timer/PomodoroTimer";

// Lucide React icons
import { Clock, Plus, X } from "lucide-react";

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
  getTodayString,
  getWeekInfo,
  quotes,
  saveBooksToStorage,
  saveTodayProgress,
  shouldShowTaskToday,
} from "./utils/helpers";

import { TASK_CATEGORIES } from "./utils/taskCategories";

// Import auth context
import { useAuth } from "./contexts/AuthContext";

const TodayTasksSection = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
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
  const todayTasks = tasks
    .filter((task) => shouldShowTaskToday(task))
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
  const completedTasks = todayTasks.filter((task) => task.completed).length;
  const totalTasks = todayTasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const remainingTasks = visibleTasks.length;

  // Calculate task counts by category for the filter
  const taskCounts = tasks
    .filter((task) => shouldShowTaskToday(task))
    .reduce((acc, task) => {
      const category = task.category || "personal";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

  // Add 'all' category count
  taskCounts.all = tasks.filter((task) => shouldShowTaskToday(task)).length;

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

  const todayString = getTodayString();

  const getRepeatBadge = (task) => {
    if (!task.repeatType || task.repeatType === "none") return null;

    const badgeClass = "text-xs font-semibold px-2 py-0.5 rounded-full";

    switch (task.repeatType) {
      case "daily":
        return (
          <span className={`${badgeClass} text-green-600 bg-green-100`}>
            Daily
          </span>
        );
      case "weekly":
        return (
          <span className={`${badgeClass} text-blue-600 bg-blue-100`}>
            Weekly
          </span>
        );
      case "custom": {
        const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const selectedDayNames =
          task.selectedDays?.map((i) => weekDays[i]).join(", ") || "";
        return (
          <span className={`${badgeClass} text-purple-600 bg-purple-100`}>
            {selectedDayNames}
          </span>
        );
      }
      default:
        return null;
    }
  };

  return (
    <section className="mb-8">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl flex items-center">
              Today's Tasks ({remainingTasks})
              <span className="ml-2 text-base font-normal text-gray-500">
                {todayString}
              </span>
            </h2>
            <span className="text-lg font-mono text-indigo-600 font-semibold">
              {progress.toFixed(2)}%
            </span>
          </div>
          <div className="mt-2">
            <CountdownTimer />
          </div>
        </div>

        {/* Mobile Filter (replaces Categories and Search) */}
        <MobileFilter
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          filterType={filterType}
          onFilterChange={onFilterChange}
          sortType={sortType}
          onSortChange={onSortChange}
          taskCounts={taskCounts}
        />

        <ProgressBar percentage={progress} />
        <ul className="mt-6 space-y-3">
          {visibleTasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-start sm:items-center group rounded-lg p-3 transition-all ${
                task.priority === "high"
                  ? "bg-red-50 border border-red-200"
                  : "hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                id={task.id}
                checked={task.completed}
                onChange={() => onToggleTask(task.id)}
                className="w-5 h-5 mt-0.5 sm:mt-0 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer flex-shrink-0"
              />
              <div className="ml-3 flex-grow min-w-0">
                {editingTaskId === task.id ? (
                  <div className="w-full">
                    <input
                      type="text"
                      value={editingTaskText}
                      onChange={(e) => setEditingTaskText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                      className="w-full text-base border-b-2 border-indigo-200 focus:border-indigo-500 outline-none mb-2"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="flex items-start sm:items-center justify-between">
                      <label
                        htmlFor={task.id}
                        className={`text-gray-700 text-base cursor-pointer transition-colors flex-grow min-w-0 pr-2 ${
                          task.completed
                            ? "line-through text-gray-400"
                            : "group-hover:text-gray-900"
                        }`}
                      >
                        {task.priority === "high" && (
                          <span className="text-red-500 mr-2">🔥</span>
                        )}
                        <span className="break-words">{task.text}</span>
                      </label>
                      {/* Action buttons - always visible on mobile, on hover for desktop */}
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit task"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete task"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* Badges row */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {task.priority === "high" && (
                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          High Priority
                        </span>
                      )}
                      {getRepeatBadge(task)}
                      {task.category && task.category !== "personal" && (
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          {TASK_CATEGORIES.find((c) => c.id === task.category)
                            ?.name || task.category}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        <AddTaskForm onAddTask={onAddTask} isTodaySection={true} />
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
  onOpenNewTaskModal,
}) => {
  const [isOpen, setIsOpen] = useState(isCurrentWeek);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(weekData.title);

  useEffect(() => {
    setIsOpen(isCurrentWeek);
  }, [isCurrentWeek]);

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
    <div className="bg-white border border-gray-100 rounded-2xl mb-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div
        className="w-full p-5 text-left flex justify-between items-center cursor-pointer"
        onClick={() => !isEditingTitle && setIsOpen(!isOpen)}
      >
        <div>
          <div className="text-sm text-gray-500 flex items-center gap-4">
            <span className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Week {weekData.week} ({weekData.weekInfo.rangeString})
            </span>
            <span className="font-semibold text-indigo-500">
              {weekData.weekInfo.remainingString}
            </span>
          </div>
          {!isEditingTitle ? (
            <div className="flex items-center group">
              <h3 className="text-lg font-semibold text-gray-900 mt-1">
                {weekData.title}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <PencilIcon className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                className="p-1 border-b-2 border-indigo-500 text-lg font-semibold outline-none"
                autoFocus
              />
              <button
                onClick={handleTitleSave}
                className="text-sm text-indigo-600 font-semibold"
              >
                Save
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-mono text-indigo-600 font-semibold">
            {weekProgress.toFixed(2)}%
          </span>
          <ChevronDownIcon
            className={`w-6 h-6 text-gray-500 transform transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>
      {isOpen && (
        <div className="px-5 pb-5">
          <ProgressBar percentage={weekProgress} />
          <ul className="mt-4 space-y-4">
            {weekData.topics.map((topic) => {
              let taskProgress = 0;
              if (topic.type === "book") {
                const completed = topic.completedPages || 0;
                const total = topic.totalPages || 1;
                taskProgress = (completed / total) * 100;
              } else {
                const completed = topic.completedMinutes || 0;
                const total = topic.totalMinutes || 1;
                taskProgress = (completed / total) * 100;
              }
              return (
                <li key={topic.id} className="p-4 bg-gray-50 rounded-lg group">
                  <div className="flex justify-between items-center mb-2">
                    {editingTaskId === topic.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editingTaskText}
                          onChange={(e) => setEditingTaskText(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveEdit()
                          }
                          className="flex-grow text-base font-semibold border-b-2 border-indigo-200 focus:border-indigo-500 outline-none"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <h4 className="font-semibold text-gray-800 flex-grow">
                        {topic.text}
                      </h4>
                    )}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={() => handleStartEdit(topic)}
                        className="p-1 text-gray-500 hover:text-indigo-600"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(topic.id)}
                        className="p-1 text-gray-500 hover:text-red-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                    <span>{formatProgress(topic)}</span>
                    <span className="font-mono text-indigo-500 font-semibold">
                      {taskProgress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-grow">
                      <ProgressBar percentage={taskProgress} />
                    </div>
                    {taskProgress >= 100 && (
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => onOpenNewTaskModal(weekData.week)}
              className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
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
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center cursor-pointer select-none"
        onClick={onClick}
      >
        <p className="text-xl italic text-gray-700">"{quote.text}"</p>
        <p className="mt-3 font-semibold text-indigo-600">- {quote.author}</p>
      </div>
    </section>
  );
};

function ProfileMenu({ onImport, onExport, onOpenStats }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

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
          <div className="p-2">
            <div className="font-semibold text-gray-900 text-base">
              Name: Rahat
            </div>
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

// Main App Component
export default function App() {
  // Auth context
  const {
    isAuthenticated,
    loading: authLoading,
    syncUserData,
    getUserData,
    isSyncing,
  } = useAuth();

  // Ref to prevent sync loops
  const isUpdatingFromFirebaseRef = useRef(false);
  const isUserAddingDataRef = useRef(false);

  // State for bottom navigation
  const [activeSection, setActiveSection] = useState("home");
  const [roadmap, setRoadmap] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [todayDailyTasks, setTodayDailyTasks] = useState([]);
  const [books, setBooks] = useState(getInitialBooks());
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [masterAddTimeModalOpen, setMasterAddTimeModalOpen] = useState(false);
  const [spanningTaskModalOpen, setSpanningTaskModalOpen] = useState(false);
  const [addWeeksModalOpen, setAddWeeksModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);

  const [newWeeklyTaskModal, setNewWeeklyTaskModal] = useState({
    isOpen: false,
    weekNumber: null,
  });

  const [quoteIndex, setQuoteIndex] = useState(() => {
    const saved = localStorage.getItem("quoteIndex");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Enhanced features state
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortType, setSortType] = useState("priority");
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem("userGoals");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false);
  const [showPomodoroTimer, setShowPomodoroTimer] = useState(false);

  useEffect(() => {
    setQuoteIndex((prev) => {
      const next = (prev + 1) % quotes.length;
      localStorage.setItem("quoteIndex", next);
      return next;
    });
  }, []);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => {
      const next = (prev + 1) % quotes.length;
      localStorage.setItem("quoteIndex", next);
      return next;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      if (authLoading) {
        // Wait for auth to complete
        return;
      }

      if (isAuthenticated) {
        // User is logged in, try to load from backend first
        try {
          const backendData = await getUserData();
          if (backendData) {
            setRoadmap(backendData.roadmap);
            setTodayTasks(backendData.todayTasks || []);
            setBooks(backendData.books || []);
            setTodayDailyTasks(backendData.todayDailyTasks || []);

            // Load user preferences
            if (backendData.userPreferences) {
              if (backendData.userPreferences.quoteIndex !== undefined) {
                setQuoteIndex(backendData.userPreferences.quoteIndex);
                localStorage.setItem(
                  "quoteIndex",
                  backendData.userPreferences.quoteIndex.toString()
                );
              }
            }

            // Also save to localStorage as backup
            localStorage.setItem(
              "roadmap",
              JSON.stringify(backendData.roadmap)
            );
            localStorage.setItem(
              "todayTasks",
              JSON.stringify(backendData.todayTasks || [])
            );
            localStorage.setItem(
              "currentBooks",
              JSON.stringify(backendData.books || [])
            );
            if (backendData.todayTasksLastReset) {
              localStorage.setItem(
                "todayTasksLastReset",
                backendData.todayTasksLastReset
              );
            }
          } else {
            // No backend data, load from localStorage
            loadFromLocalStorage();
          }
        } catch (error) {
          console.error(
            "Failed to load from backend, using localStorage:",
            error
          );
          loadFromLocalStorage();
        }
      } else {
        // User not logged in, load from localStorage only
        loadFromLocalStorage();
      }

      setLoading(false);
    };

    const loadFromLocalStorage = () => {
      let storedRoadmap = null;
      let storedTodayTasks = null;
      try {
        const roadmapString = localStorage.getItem("roadmap");
        if (roadmapString && roadmapString !== "null") {
          storedRoadmap = JSON.parse(roadmapString);
        }
        const todayTasksString = localStorage.getItem("todayTasks");
        if (todayTasksString) {
          storedTodayTasks = JSON.parse(todayTasksString);
        }
      } catch {
        storedRoadmap = null;
        storedTodayTasks = null;
      }

      if (storedRoadmap) {
        setRoadmap(storedRoadmap);
      } else {
        // No demo data - start with null roadmap
        setRoadmap(null);
      }

      if (storedTodayTasks) {
        setTodayTasks(storedTodayTasks);
      } else {
        // No demo data - start with empty array
        setTodayTasks([]);
      }
    };

    loadData();
  }, [isAuthenticated, authLoading, getUserData]);

  // Listen for real-time Firebase updates
  useEffect(() => {
    const handleFirebaseUpdate = (event) => {
      const data = event.detail;
      console.log("📱 Updating app state from real-time Firebase data:", data);

      // Set the ref to prevent sync loops
      isUpdatingFromFirebaseRef.current = true;

      if (data.roadmap !== undefined) {
        setRoadmap(data.roadmap);
        localStorage.setItem("roadmap", JSON.stringify(data.roadmap));
      }

      if (data.todayTasks !== undefined) {
        setTodayTasks(data.todayTasks);
        localStorage.setItem("todayTasks", JSON.stringify(data.todayTasks));
      }

      if (data.books !== undefined) {
        setBooks(data.books);
        localStorage.setItem("currentBooks", JSON.stringify(data.books));
      }

      // For authenticated users, don't store todayTasksLastReset in localStorage
      // It should only be stored in Firebase to avoid conflicts
      if (data.todayTasksLastReset) {
        console.log(
          "📅 Reset date from Firebase update:",
          data.todayTasksLastReset
        );
        // No localStorage storage for authenticated users to prevent conflicts
      }

      // Sync user preferences
      if (data.userPreferences) {
        if (data.userPreferences.quoteIndex !== undefined) {
          setQuoteIndex(data.userPreferences.quoteIndex);
          localStorage.setItem(
            "quoteIndex",
            data.userPreferences.quoteIndex.toString()
          );
        }
      }

      // Clear the flag after a delay to prevent rapid updates
      setTimeout(() => {
        isUpdatingFromFirebaseRef.current = false;
      }, 500);
    };

    window.addEventListener("firebaseDataUpdate", handleFirebaseUpdate);

    return () => {
      window.removeEventListener("firebaseDataUpdate", handleFirebaseUpdate);
    };
  }, []); // Empty dependency array  // Handle daily progress updates separately
  useEffect(() => {
    const handleDailyProgressUpdate = async (event) => {
      if (
        !isAuthenticated ||
        isUpdatingFromFirebaseRef.current ||
        isUserAddingDataRef.current ||
        isSyncing
      )
        return;

      const { date, progress } = event.detail;
      console.log("📊 Syncing daily progress to Firebase:", { date, progress });

      try {
        // Get current reset date from Firebase - preserve existing value
        let todayTasksLastReset = getDateString();
        const userData = await getUserData();
        todayTasksLastReset = userData?.todayTasksLastReset || getDateString();

        await syncUserData({
          roadmap: roadmap || null,
          todayTasks: todayTasks || [],
          todayDailyTasks: todayDailyTasks || [],
          books: books || [],
          todayTasksLastReset, // Preserve existing reset date
          dailyProgress: {
            [date]: progress,
          },
        });
      } catch (err) {
        console.error("Failed to sync daily progress:", err);
      }
    };

    window.addEventListener("dailyProgressUpdate", handleDailyProgressUpdate);

    return () => {
      window.removeEventListener(
        "dailyProgressUpdate",
        handleDailyProgressUpdate
      );
    };
  }, [
    isAuthenticated,
    isSyncing,
    roadmap,
    todayTasks,
    todayDailyTasks,
    books,
    syncUserData,
    getUserData,
  ]);

  useEffect(() => {
    if (
      loading ||
      authLoading ||
      isUpdatingFromFirebaseRef.current ||
      isUserAddingDataRef.current ||
      isSyncing
    )
      return;

    // Debounce Firebase sync to prevent too many writes
    const timeoutId = setTimeout(async () => {
      try {
        // Always save to localStorage as backup
        localStorage.setItem("roadmap", JSON.stringify(roadmap));
        localStorage.setItem("todayTasks", JSON.stringify(todayTasks));
        saveBooksToStorage(books);

        // If authenticated, also sync to backend
        if (isAuthenticated) {
          // Preserve existing reset date from Firebase
          let todayTasksLastReset = getDateString();
          try {
            const userData = await getUserData();
            todayTasksLastReset =
              userData?.todayTasksLastReset || getDateString();
          } catch (error) {
            console.error("Error getting reset date for sync:", error);
            // Keep current date as fallback
          }

          // Include user preferences like quoteIndex
          const quoteIndex = localStorage.getItem("quoteIndex");

          console.log(
            "💾 Syncing all data to Firebase (preserving reset date)..."
          );
          syncUserData({
            roadmap: roadmap || null,
            todayTasks: todayTasks || [],
            todayDailyTasks: todayDailyTasks || [],
            books: books || [],
            todayTasksLastReset, // Preserve existing reset date
            userPreferences: {
              quoteIndex: quoteIndex ? parseInt(quoteIndex, 10) : 0,
            },
          });
        }
      } catch (e) {
        console.error("Failed to save data:", e);
      }
    }, 800); // Reduced debounce to 800ms for faster sync

    return () => clearTimeout(timeoutId);
  }, [
    roadmap,
    todayTasks,
    todayDailyTasks,
    books,
    quoteIndex,
    loading,
    authLoading,
    isAuthenticated,
    isSyncing,
    syncUserData,
    getUserData,
  ]);

  // --- Daily Reset Logic (Firebase-only, no localStorage conflicts) ---
  useEffect(() => {
    let resetInProgress = false;

    const doResetIfNeeded = async () => {
      // Skip if reset already in progress or conditions not met
      if (
        resetInProgress ||
        !isAuthenticated ||
        loading ||
        authLoading ||
        isUpdatingFromFirebaseRef.current
      ) {
        return;
      }

      try {
        resetInProgress = true;
        const today = getDateString();
        const userData = await getUserData();
        const lastReset = userData?.todayTasksLastReset;

        if (lastReset !== today) {
          console.log("🔄 Starting daily reset for tasks...");

          // Block Firebase updates to prevent conflicts
          isUpdatingFromFirebaseRef.current = true;

          // Get current tasks snapshot
          const currentTasks = [...todayTasks];

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

          // Reset daily progress
          saveTodayProgress(0, 0);

          // Reset Today's Daily Tasks progress
          const resetTodayDailyTasks = todayDailyTasks.map((task) => ({
            ...task,
            ...(task.type === "course"
              ? { progressHours: 0, progressMinutes: 0 }
              : { progress: 0 }),
          }));

          // Update state first
          setTodayTasks(resetTasks);
          setTodayDailyTasks(resetTodayDailyTasks);

          // Sync to Firebase immediately with all data
          await syncUserData({
            roadmap: roadmap || null,
            todayTasks: resetTasks,
            todayDailyTasks: resetTodayDailyTasks,
            books: books || [],
            todayTasksLastReset: today,
            userPreferences: {
              quoteIndex: parseInt(
                localStorage.getItem("quoteIndex") || "0",
                10
              ),
            },
          });

          console.log("✅ Daily reset completed and synced to Firebase");
        }
      } catch (error) {
        console.error("❌ Daily reset failed:", error);
      } finally {
        resetInProgress = false;
        // Re-enable Firebase updates after a delay
        setTimeout(() => {
          isUpdatingFromFirebaseRef.current = false;
        }, 1000);
      }
    };

    // Initial reset check after a brief delay to ensure everything is loaded
    const initialTimeout = setTimeout(doResetIfNeeded, 1000);

    // Check for reset every hour
    const intervalId = setInterval(doResetIfNeeded, 1000 * 60 * 60);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [
    isAuthenticated,
    loading,
    authLoading,
    getUserData,
    syncUserData,
    roadmap,
    books,
    todayTasks,
    todayDailyTasks,
  ]);

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  // Force immediate sync function
  const forceSyncToFirebase = async (
    updatedRoadmap = roadmap,
    updatedTodayTasks = todayTasks,
    updatedBooks = books,
    updatedTodayDailyTasks = todayDailyTasks
  ) => {
    try {
      // Always save to localStorage first as backup
      localStorage.setItem("roadmap", JSON.stringify(updatedRoadmap || null));
      localStorage.setItem(
        "todayTasks",
        JSON.stringify(updatedTodayTasks || [])
      );
      saveBooksToStorage(updatedBooks || []);

      if (!isAuthenticated) {
        console.log("💾 Saved to localStorage (not authenticated)");
        return;
      }

      // Preserve existing reset date from Firebase
      let todayTasksLastReset = getDateString();
      try {
        const userData = await getUserData();
        todayTasksLastReset = userData?.todayTasksLastReset || getDateString();
      } catch (err) {
        console.error("Error getting reset date for force sync:", err);
        // Keep current date as fallback
      }

      const quoteIndex = localStorage.getItem("quoteIndex");

      console.log(
        "🚀 Force syncing data to Firebase (preserving reset date)..."
      );
      await syncUserData({
        roadmap: updatedRoadmap || null,
        todayTasks: updatedTodayTasks || [],
        todayDailyTasks: updatedTodayDailyTasks || [],
        books: updatedBooks || [],
        todayTasksLastReset, // Preserve existing reset date
        userPreferences: {
          quoteIndex: quoteIndex ? parseInt(quoteIndex, 10) : 0,
        },
      });
      console.log("✅ Force sync completed successfully");
    } catch (error) {
      console.error(
        "❌ Force sync failed, but data is saved to localStorage:",
        error
      );
    }
  };

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

    // Allow syncing after a shorter delay and force sync with updated roadmap
    setTimeout(async () => {
      isUserAddingDataRef.current = false;
      await forceSyncToFirebase(newRoadmap, todayTasks, books);
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

    // Allow syncing after a shorter delay and force sync with updated roadmap
    setTimeout(async () => {
      isUserAddingDataRef.current = false;
      await forceSyncToFirebase(newRoadmap, todayTasks, books);
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
    }

    setRoadmap(newRoadmap);
    setSpanningTaskModalOpen(false);
  };

  const handleAddWeeklyTask = (weekNumber, { name, hours, minutes }) => {
    const newRoadmap = deepClone(roadmap);
    const week = newRoadmap.phases[0].weeks.find((w) => w.week === weekNumber);
    if (week) {
      const totalMinutes =
        (parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0);
      week.topics.push({
        text: name,
        totalMinutes: totalMinutes,
        completedMinutes: 0,
        id: `custom-roadmap-${Date.now()}`,
        type: "time",
      });

      const dailyMinutes = totalMinutes / 7;
      const dailyTaskText = `${name} - ${formatDailyMinutes(dailyMinutes)}`;
      handleAddTodayTask(dailyTaskText, true);

      // Also add to Today's section as a course task with daily portion (1/7th of weekly total)
      const dailyHours = Math.floor(dailyMinutes / 60);
      const remainingDailyMinutes = Math.round(dailyMinutes % 60);

      const newTodayTask = {
        id: `today-${Date.now()}`,
        name: `${name} (Daily)`,
        type: "course",
        totalHours: dailyHours,
        totalMinutes: remainingDailyMinutes,
        progressHours: 0,
        progressMinutes: 0,
      };

      const updatedTodayTasks = [...todayDailyTasks, newTodayTask];
      setTodayDailyTasks(updatedTodayTasks);

      if (isAuthenticated) {
        syncUserData({
          todayDailyTasks: updatedTodayTasks,
        });
      }
    }
    setRoadmap(newRoadmap);
    setNewWeeklyTaskModal({ isOpen: false, weekNumber: null });
  };

  const handleDeleteRoadmapTask = (taskId) => {
    const newRoadmap = deepClone(roadmap);
    newRoadmap.phases.forEach((p) =>
      p.weeks.forEach((w) => {
        w.topics = w.topics.filter((t) => t.id !== taskId);
      })
    );
    setRoadmap(newRoadmap);
  };

  const handleEditRoadmapTask = (taskId, newText) => {
    const newRoadmap = deepClone(roadmap);
    for (const phase of newRoadmap.phases) {
      for (const week of phase.weeks) {
        const topic = week.topics.find((t) => t.id === taskId);
        if (topic) {
          topic.text = newText;
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

    setTodayTasks((prev) => [...prev, newTask]);
  };
  const handleToggleTodayTask = (taskId) =>
    setTodayTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  const handleDeleteTodayTask = (taskId) =>
    setTodayTasks((prev) => prev.filter((task) => task.id !== taskId));
  const handleEditTodayTask = (taskId, newText) =>
    setTodayTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, text: newText } : task
      )
    );

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
        roadmap,
        todayTasks,
        books,
        todayTasksLastReset:
          localStorage.getItem("todayTasksLastReset") || getDateString(),
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
          // Basic validation
          if (importedData.roadmap && importedData.todayTasks) {
            setRoadmap(importedData.roadmap);
            setTodayTasks(importedData.todayTasks);
            setBooks(importedData.books || []);
            if (importedData.todayTasksLastReset) {
              localStorage.setItem(
                "todayTasksLastReset",
                importedData.todayTasksLastReset
              );
            }
          } else {
            console.error("Invalid backup file format.");
          }
        } catch (error) {
          console.error("Failed to parse backup file:", error);
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
    roadmap.phases.forEach((phase) =>
      phase.weeks.forEach((week) => {
        week.topics.forEach((topic) => {
          totalTasks++;
          if (topic.type === "book") {
            const completed = topic.completedPages || 0;
            const total = topic.totalPages || 1;
            totalProgress += (completed / total) * 100;
          } else {
            const completed = topic.completedMinutes || 0;
            const total = topic.totalMinutes || 1;
            totalProgress += (completed / total) * 100;
          }
        });
      })
    );
    return totalTasks > 0 ? totalProgress / totalTasks : 0;
  }, [roadmap]);

  const aggregatedStats = useMemo(() => {
    if (!roadmap) return { courses: {}, books: {} };

    const courses = {};
    const books = {};

    roadmap.phases.forEach((phase) => {
      phase.weeks.forEach((week) => {
        week.topics.forEach((topic) => {
          if (topic.type === "book") {
            if (!books[topic.text]) books[topic.text] = 0;
            books[topic.text] += topic.completedPages || 0;
          } else {
            if (!courses[topic.text]) courses[topic.text] = 0;
            courses[topic.text] += topic.completedMinutes || 0;
          }
        });
      });
    });

    return { courses, books };
  }, [roadmap]);

  const openNewTaskModal = (weekNumber) => {
    setNewWeeklyTaskModal({ isOpen: true, weekNumber });
  };

  // --- Today Section State ---
  const [addTodayTaskModalOpen, setAddTodayTaskModalOpen] = useState(false);
  const [editingTodayTask, setEditingTodayTask] = useState(null);
  const [addTodayProgressModalOpen, setAddTodayProgressModalOpen] =
    useState(false);

  // --- Today Section Handlers ---
  const handleSaveTodayTaskFromModal = (taskData) => {
    if (editingTodayTask) {
      // Update existing task
      const updatedTasks = todayDailyTasks.map((task) =>
        task.id === editingTodayTask.id ? { ...task, ...taskData } : task
      );
      setTodayDailyTasks(updatedTasks);

      if (isAuthenticated) {
        syncUserData({ todayDailyTasks: updatedTasks });
      }
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
      setTodayDailyTasks(updatedTasks);

      if (isAuthenticated) {
        syncUserData({ todayDailyTasks: updatedTasks });
      }
    }

    setAddTodayTaskModalOpen(false);
    setEditingTodayTask(null);
  };

  const handleAddTodayProgressFromModal = (progressData) => {
    if (progressData.hours !== undefined) {
      // Handle time-based progress
      const updatedTasks = todayDailyTasks.map((task) => {
        if (task.id === progressData.taskId) {
          const newProgressMinutes =
            (task.progressMinutes || 0) + progressData.minutes;
          const newProgressHours =
            (task.progressHours || 0) +
            progressData.hours +
            Math.floor(newProgressMinutes / 60);
          const finalProgressMinutes = newProgressMinutes % 60;

          // Cap progress at total
          const totalMinutesTotal =
            (task.totalHours || 0) * 60 + (task.totalMinutes || 0);
          const currentProgressMinutes =
            newProgressHours * 60 + finalProgressMinutes;

          if (currentProgressMinutes >= totalMinutesTotal) {
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

      setTodayDailyTasks(updatedTasks);
      if (isAuthenticated) {
        syncUserData({ todayDailyTasks: updatedTasks });
      }
    } else {
      // Handle page-based progress
      const updatedTasks = todayDailyTasks.map((task) =>
        task.id === progressData.taskId
          ? {
              ...task,
              progress: Math.min(
                (task.progress || 0) + progressData.pages,
                task.total || 0
              ),
            }
          : task
      );

      setTodayDailyTasks(updatedTasks);
      if (isAuthenticated) {
        syncUserData({ todayDailyTasks: updatedTasks });
      }
    }

    setAddTodayProgressModalOpen(false);
  };

  const handleDeleteTodayDailyTask = (taskId) => {
    const updatedTasks = todayDailyTasks.filter((task) => task.id !== taskId);
    setTodayDailyTasks(updatedTasks);

    if (isAuthenticated) {
      syncUserData({ todayDailyTasks: updatedTasks });
    }
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
    setTodayDailyTasks(updatedTasks);

    if (isAuthenticated) {
      syncUserData({ todayDailyTasks: updatedTasks });
    }
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
              <div className="flex flex-col items-end sm:items-center w-full sm:w-auto">
                <button
                  onClick={() => setAddTodayProgressModalOpen(true)}
                  className="bg-indigo-600 text-white font-bold p-2 sm:px-5 sm:py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center self-end sm:self-center"
                >
                  <PlusCircleIcon className="w-5 h-5 sm:mr-2" />
                  <span className="hidden sm:inline">Add Progress</span>
                </button>
              </div>
            </div>
            <div className="px-6 pb-6">
              <ProgressBar percentage={overallProgressCalc} />
            </div>
          </div>
        </section>

        {/* Today Tasks Section */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="w-full flex justify-between items-center p-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                Today
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
                  No daily tasks added yet.
                </div>
              ) : (
                <ul className="space-y-4 mt-4">
                  {todayDailyTasks.map((task) => {
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
                    } else {
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
                        className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2 shadow-sm border border-gray-100 group"
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-semibold text-gray-800 text-lg">
                            {task.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                            : `${progressDisplay} of ${totalDisplay} pages completed`}
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
            onClose={() => setAddTodayProgressModalOpen(false)}
            onSave={handleAddTodayProgressFromModal}
            tasks={todayDailyTasks}
          />
        </section>
      </>
    );
  };

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

      {/* Floating Pomodoro Timer Button */}
      <button
        onClick={() => setShowPomodoroTimer(!showPomodoroTimer)}
        className="fixed bottom-6 right-6 bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-all z-40 flex items-center gap-2"
        title="Pomodoro Timer"
      >
        <Clock size={24} />
      </button>

      {/* Pomodoro Timer Modal */}
      {showPomodoroTimer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Pomodoro Timer
              </h3>
              <button
                onClick={() => setShowPomodoroTimer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <PomodoroTimer />
          </div>
        </div>
      )}

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
                onAddTask={handleAddTodayTask}
                onToggleTask={handleToggleTodayTask}
                onDeleteTask={handleDeleteTodayTask}
                onEditTask={handleEditTodayTask}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                filterType={filterType}
                onFilterChange={setFilterType}
                sortType={sortType}
                onSortChange={setSortType}
              />
            </>
          )}
          {activeSection === "books" && <TodaySection />}
          {activeSection === "progress" && roadmap && (
            <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex-1 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Overall Progress
                  </h2>
                  <span className="text-lg font-mono text-indigo-600 font-semibold ml-4">
                    {overallProgress.toFixed(2)}%
                  </span>
                </div>
                <div className="flex flex-col items-end sm:items-center w-full sm:w-auto">
                  <button
                    onClick={() => setMasterAddTimeModalOpen(true)}
                    className="bg-indigo-600 text-white font-bold p-2 sm:px-5 sm:py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center self-end sm:self-center"
                  >
                    <PlusCircleIcon className="w-5 h-5 sm:mr-2" />
                    <span className="hidden sm:inline">Add Progress</span>
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar percentage={overallProgress} />
              </div>
            </div>
          )}
          {activeSection === "progress" &&
            roadmap &&
            roadmap.phases &&
            roadmap.phases.map((phase, phaseIndex) => (
              <section key={phaseIndex} className="mb-10">
                <div className="mb-4 flex justify-between items-center gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 border-l-4 border-indigo-600 pl-4">
                      {phase.phase}
                    </h2>
                    <p className="text-gray-600 mt-1 pl-5">{phase.duration}</p>
                  </div>
                  <button
                    onClick={() => setSpanningTaskModalOpen(true)}
                    className="bg-white border border-indigo-600 text-indigo-600 font-bold p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center text-sm flex-shrink-0"
                  >
                    <PlusCircleIcon className="w-5 h-5 sm:mr-2" />
                    <span className="hidden sm:inline">
                      Add Multi-Week Task
                    </span>
                  </button>
                </div>
                {phase.weeks
                  .filter((week) => calculateWeekProgress(week) < 100)
                  .map((week) => (
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
                      onOpenNewTaskModal={openNewTaskModal}
                    />
                  ))}
              </section>
            ))}
          {activeSection === "progress" && !roadmap && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-700">
                No Weekly Progress
              </h2>
              <p className="text-gray-500 mt-2 mb-6">
                Get started by adding a new weekly plan.
              </p>
              <button
                onClick={() => setAddWeeksModalOpen(true)}
                className="bg-indigo-600 text-white font-bold px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center mx-auto"
              >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Add Weeks
              </button>
            </div>
          )}
          {activeSection === "analytics" && (
            <div className="space-y-8">
              {/* Main Analytics Dashboard */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart2Icon className="w-8 h-8 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Analytics Dashboard
                  </h2>
                </div>

                {/* Progress Charts */}
                <ProgressCharts
                  todayTasks={todayTasks}
                  roadmap={roadmap}
                  books={books}
                  className="mb-8"
                />

                {/* Today's Progress Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">
                          Today's Study Hours
                        </p>
                        <p className="text-3xl font-bold">
                          {getTodayProgress().hoursCompleted.toFixed(1)}h
                        </p>
                        <p className="text-blue-200 text-sm mt-1">
                          Hours completed today
                        </p>
                      </div>
                      <ClockIcon className="w-12 h-12 text-blue-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">
                          Today's Pages Read
                        </p>
                        <p className="text-3xl font-bold">
                          {getTodayProgress().pagesRead}
                        </p>
                        <p className="text-green-200 text-sm mt-1">
                          Pages read today
                        </p>
                      </div>
                      <BookOpenIcon className="w-12 h-12 text-green-200" />
                    </div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-8">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg sm:rounded-xl p-2 sm:p-4 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-center sm:text-left">
                        <p className="text-purple-100 text-xs sm:text-sm">
                          <span className="block sm:hidden">Tasks</span>
                          <span className="hidden sm:block">Today's Tasks</span>
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                          {
                            todayTasks.filter(
                              (task) =>
                                shouldShowTaskToday(task) && !task.completed
                            ).length
                          }
                        </p>
                      </div>
                      <CheckCircleIcon className="w-4 h-4 sm:w-6 sm:h-6 text-purple-200 mx-auto sm:mx-0 mt-1 sm:mt-0" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl p-2 sm:p-4 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-center sm:text-left">
                        <p className="text-emerald-100 text-xs sm:text-sm">
                          <span className="block sm:hidden">Done</span>
                          <span className="hidden sm:block">
                            Completed Today
                          </span>
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                          {
                            todayTasks.filter(
                              (task) =>
                                shouldShowTaskToday(task) && task.completed
                            ).length
                          }
                        </p>
                      </div>
                      <CheckCircleIcon className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-200 mx-auto sm:mx-0 mt-1 sm:mt-0" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg sm:rounded-xl p-2 sm:p-4 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-center sm:text-left">
                        <p className="text-red-100 text-xs sm:text-sm">
                          <span className="block sm:hidden">Priority</span>
                          <span className="hidden sm:block">High Priority</span>
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                          {
                            todayTasks.filter(
                              (task) =>
                                task.priority === "high" && !task.completed
                            ).length
                          }
                        </p>
                      </div>
                      <span className="text-lg sm:text-2xl mx-auto sm:mx-0 mt-1 sm:mt-0">
                        🔥
                      </span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg sm:rounded-xl p-2 sm:p-4 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-center sm:text-left">
                        <p className="text-orange-100 text-xs sm:text-sm">
                          <span className="block sm:hidden">Books</span>
                          <span className="hidden sm:block">Reading Books</span>
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                          {books.length}
                        </p>
                      </div>
                      <BookOpenIcon className="w-4 h-4 sm:w-6 sm:h-6 text-orange-200 mx-auto sm:mx-0 mt-1 sm:mt-0" />
                    </div>
                  </div>
                </div>

                {/* Progress Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Today's Progress
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Task Completion</span>
                          <span>
                            {(
                              (todayTasks.filter(
                                (task) =>
                                  shouldShowTaskToday(task) && task.completed
                              ).length /
                                Math.max(
                                  todayTasks.filter((task) =>
                                    shouldShowTaskToday(task)
                                  ).length,
                                  1
                                )) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <ProgressBar
                          percentage={
                            (todayTasks.filter(
                              (task) =>
                                shouldShowTaskToday(task) && task.completed
                            ).length /
                              Math.max(
                                todayTasks.filter((task) =>
                                  shouldShowTaskToday(task)
                                ).length,
                                1
                              )) *
                            100
                          }
                        />
                      </div>
                      {roadmap && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Weekly Progress</span>
                            <span>{overallProgress.toFixed(1)}%</span>
                          </div>
                          <ProgressBar percentage={overallProgress} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Task Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Normal Priority</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                          {
                            todayTasks.filter(
                              (task) => task.priority === "normal"
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">High Priority</span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                          {
                            todayTasks.filter(
                              (task) => task.priority === "high"
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Daily Tasks</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                          {
                            todayTasks.filter(
                              (task) => task.repeatType === "daily"
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Weekly Tasks</span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
                          {
                            todayTasks.filter(
                              (task) => task.repeatType === "weekly"
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {todayTasks
                      .filter((task) => task.completed)
                      .slice(-5)
                      .reverse()
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg"
                        >
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700 flex-grow">
                            {task.text}
                          </span>
                          {task.priority === "high" && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                              High Priority
                            </span>
                          )}
                        </div>
                      ))}
                    {todayTasks.filter((task) => task.completed).length ===
                      0 && (
                      <p className="text-gray-500 text-center py-4">
                        No completed tasks yet today.
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setStatsModalOpen(true)}
                    className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <BarChart2Icon className="w-5 h-5" />
                    Detailed Statistics
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    📊 Export Data
                  </button>
                </div>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              {/* Goals Section */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    🎯 Goals
                  </h3>
                  <button
                    onClick={() => setAddGoalModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Goal
                  </button>
                </div>

                <div className="grid gap-4">
                  {goals.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No goals set yet. Create your first goal to start tracking
                      your progress!
                    </p>
                  ) : (
                    goals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onUpdate={(updatedGoal) => {
                          setGoals((prev) =>
                            prev.map((g) =>
                              g.id === goal.id ? updatedGoal : g
                            )
                          );
                        }}
                        onDelete={(goalId) => {
                          setGoals((prev) =>
                            prev.filter((g) => g.id !== goalId)
                          );
                        }}
                      />
                    ))
                  )}
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
            onClick={() => setActiveSection("home")}
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
            onClick={() => setActiveSection("progress")}
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
            onClick={() => setActiveSection("books")}
          >
            {" "}
            <BookOpenIcon className="w-6 h-6 mb-1" />{" "}
            <span className="text-xs font-medium">Daily</span>{" "}
          </button>
          <button
            className={`flex flex-col items-center flex-1 py-2 ${
              activeSection === "analytics"
                ? "text-indigo-600"
                : "text-gray-400 hover:text-indigo-500"
            }`}
            onClick={() => setActiveSection("analytics")}
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
            onClick={() => setActiveSection("profile")}
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
    if (!roadmap) return [];
    const taskSet = new Set();
    roadmap.phases.forEach((p) =>
      p.weeks.forEach((w) =>
        w.topics.forEach((t) => {
          if (t.type !== "book" && (t.completedMinutes || 0) < t.totalMinutes) {
            taskSet.add(t.text);
          }
        })
      )
    );
    console.log("⏰ Available time tasks:", Array.from(taskSet));
    return Array.from(taskSet);
  }, [roadmap]);

  const availableBookTasks = useMemo(() => {
    if (!roadmap) return [];
    const taskSet = new Set();
    roadmap.phases.forEach((p) =>
      p.weeks.forEach((w) =>
        w.topics.forEach((t) => {
          if (t.type === "book" && (t.completedPages || 0) < t.totalPages) {
            taskSet.add(t.text);
          }
        })
      )
    );
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

// Modern ProfileMenu with avatar and dropdown
function ProfileMenuModern({ onImport, onExport, onOpenStats }) {
  const [open, setOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const { user, logout, isAuthenticated } = useAuth();

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

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  const handleLoginClick = () => {
    setOpen(false);
    setLoginModalOpen(true);
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
              <div>
                <div className="font-semibold text-gray-900 text-base">
                  {isAuthenticated ? user?.name || "User" : "Guest"}
                </div>
                <div className="text-xs text-gray-500">
                  {isAuthenticated ? "Authenticated" : "Not logged in"}
                </div>
              </div>
            </div>

            {isAuthenticated ? (
              <>
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
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleLoginClick}
                className="w-full text-left px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md text-sm font-medium"
              >
                Login to sync data
              </button>
            )}

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
              © 2025 Progress Tracker
            </div>
          </div>
        )}
      </div>

      {/* Authentication Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
      />
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
    </>
  );
}

function AddNewWeeklyTaskModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name: name.trim(), hours: hours || 0, minutes: minutes || 0 });
      setName("");
      setHours("");
      setMinutes("");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setHours("");
      setMinutes("");
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
  const [mode, setMode] = useState("task"); // 'task' or 'book'
  const [name, setName] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [pages, setPages] = useState("");
  const [numWeeks, setNumWeeks] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && numWeeks > 0) {
      if (mode === "task") {
        onSave({ type: "time", name: name.trim(), hours, minutes, numWeeks });
      } else {
        onSave({ type: "book", name: name.trim(), pages, numWeeks });
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setHours("");
      setMinutes("");
      setPages("");
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
      </div>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="spanning-task-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {mode === "task" ? "Task Name" : "Book Title"}
            </label>
            <input
              type="text"
              id="spanning-task-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                mode === "task"
                  ? "e.g., Master a New Skill"
                  : "e.g., The Great Gatsby"
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
          ) : (
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
          )}

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
  const [pages, setPages] = useState("");

  useEffect(() => {
    if (editingTask) {
      setName(editingTask.name);
      setType(editingTask.type);
      if (editingTask.type === "course") {
        setHours((editingTask.totalHours || 0).toString());
        setMinutes((editingTask.totalMinutes || 0).toString());
        setPages("");
      } else {
        setHours("");
        setMinutes("");
        setPages((editingTask.total || 0).toString());
      }
    } else {
      setName("");
      setType("course");
      setHours("");
      setMinutes("");
      setPages("");
    }
  }, [editingTask, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    let taskData;
    if (type === "course") {
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      if (h === 0 && m === 0) return;

      // Convert minutes > 59 to hours and remaining minutes
      const totalMinutes = h * 60 + m;
      const finalHours = Math.floor(totalMinutes / 60);
      const finalMinutes = totalMinutes % 60;

      taskData = {
        name: name.trim(),
        type: type,
        totalHours: finalHours,
        totalMinutes: finalMinutes,
      };
    } else {
      const p = parseInt(pages) || 0;
      if (p <= 0) return;

      taskData = {
        name: name.trim(),
        type: type,
        total: p,
      };
    }

    if (name.trim()) {
      onSave(taskData);
      setName("");
      setType("course");
      setHours("");
      setMinutes("");
      setPages("");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? "Edit Task" : "Add Today Task"}
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
          ) : (
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
          )}
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
function AddTodayProgressModal({ isOpen, onClose, onSave, tasks }) {
  const [mode, setMode] = useState("time"); // 'time' or 'book'
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [pages, setPages] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSelectedTaskId("");
      setHours("");
      setMinutes("");
      setPages("");
    }
  }, [isOpen]);

  // Filter tasks by type based on mode
  const availableTimeTasks = tasks.filter((task) => task.type === "course");
  const availableBookTasks = tasks.filter((task) => task.type === "book");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTaskId) return;

    let progressData;
    if (mode === "time") {
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      if (h === 0 && m === 0) return;

      // Convert minutes > 59 to hours and remaining minutes
      const totalMinutes = h * 60 + m;
      const finalHours = Math.floor(totalMinutes / 60);
      const finalMinutes = totalMinutes % 60;

      progressData = {
        taskId: selectedTaskId,
        hours: finalHours,
        minutes: finalMinutes,
      };
    } else {
      const p = parseInt(pages) || 0;
      if (p <= 0) return;

      progressData = {
        taskId: selectedTaskId,
        pages: p,
      };
    }

    onSave(progressData);
    setSelectedTaskId("");
    setHours("");
    setMinutes("");
    setPages("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Progress">
      {/* Tab buttons */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => {
            setMode("time");
            setSelectedTaskId("");
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
            setMode("book");
            setSelectedTaskId("");
          }}
          className={`px-4 py-2 text-sm font-medium ${
            mode === "book"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Add Book
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === "time" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Course Task
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                required
              >
                <option value="">Choose a course task</option>
                {availableTimeTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedTaskId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Progress
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
                      autoFocus
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
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Book Task
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                required
              >
                <option value="">Choose a book task</option>
                {availableBookTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedTaskId && (
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
                />
              </div>
            )}
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
            Add
          </button>
        </div>
      </form>
    </Modal>
  );
}
