import { Check, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  addCustomTimePreset,
  addLabel,
  addPomodoroTime,
  getAvailableLabels,
  getCustomTimePresets,
  getTodayStats,
  removeCustomTimePreset,
  removeLabel,
} from "../../utils/pomodoroStats";

const TIMER_STATES = {
  WORK: "work",
  SHORT_BREAK: "shortBreak",
  LONG_BREAK: "longBreak",
};

export const PomodoroTimer = ({ onTimerStateChange, initialState }) => {
  // Use parent state as source of truth
  const [isRunning, setIsRunning] = useState(initialState?.isRunning || false);
  const [timeLeft, setTimeLeft] = useState(initialState?.timeLeft || 25 * 60);
  const [currentState, setCurrentState] = useState(
    initialState?.currentState || TIMER_STATES.WORK
  );
  const [sessionsCompleted] = useState(0);
  const [settings, setSettings] = useState({
    workTime: 30, // Changed default from 25 to 30
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
  });
  const [customTime, setCustomTime] = useState(30);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("programming"); // Default to "programming"
  const [availableLabels, setAvailableLabels] = useState([
    "study",
    "programming",
    "other",
  ]);
  const [newLabel, setNewLabel] = useState("");
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [timePresets, setTimePresets] = useState([]);
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [newPresetTime, setNewPresetTime] = useState("");
  const [newPresetEmoji, setNewPresetEmoji] = useState("⏰");
  const [todayStats, setTodayStats] = useState({ minutes: 0 });

  const audioRef = useRef(null);
  const initialTimeRef = useRef(0);

  // Keep component state in sync with parent state
  useEffect(() => {
    if (initialState) {
      setTimeLeft(initialState.timeLeft || 25 * 60);
      setIsRunning(initialState.isRunning || false);
      setCurrentState(initialState.currentState || TIMER_STATES.WORK);
    }
  }, [initialState]);

  // Load available labels and time presets on mount
  useEffect(() => {
    const labels = getAvailableLabels();
    setAvailableLabels(labels);
    // Default to "programming" if available, otherwise first label
    setSelectedLabel(
      labels.includes("programming")
        ? "programming"
        : labels[0] || "programming"
    );

    // Load custom time presets
    const presets = getCustomTimePresets();
    setTimePresets(presets);

    // Load today's stats
    const stats = getTodayStats();
    setTodayStats(stats);

    // Set 30 minutes as default if component is initializing
    if (initialState?.timeLeft === 25 * 60 || !initialState?.timeLeft) {
      setTimeLeft(30 * 60);
      setSettings((prev) => ({ ...prev, workTime: 30 }));
    }
  }, [initialState?.timeLeft]);

  // Notify parent of state changes only when user initiates them, not during sync
  const notifyParent = useCallback(
    (newState) => {
      if (onTimerStateChange) {
        onTimerStateChange(newState);
      }
    },
    [onTimerStateChange]
  );

  // Timer is now managed by parent component, no internal interval needed

  const startTimer = () => {
    console.log("🚀 Start button clicked!", {
      timeLeft,
      currentState,
      isRunning,
    });
    setIsRunning(true);

    // Store the initial time when starting
    initialTimeRef.current = timeLeft;

    // Immediately notify parent with complete state
    const newState = {
      isRunning: true,
      timeLeft,
      currentState,
      totalTime: timeLeft, // Use timeLeft as totalTime since it reflects custom time
      selectedLabel, // Include selected category for proper tracking
    };
    console.log("📡 Notifying parent with state:", newState);
    notifyParent(newState);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    // Use the stored initial time as totalTime
    const totalTime = initialTimeRef.current || timeLeft;
    // Immediately notify parent with complete state
    notifyParent({
      isRunning: false,
      timeLeft,
      currentState,
      totalTime,
      selectedLabel, // Include selected category
    });
  };

  const resetTimer = () => {
    // Calculate elapsed time and add to statistics if timer was running
    const initialTime = initialTimeRef.current || getCurrentTimerDuration();
    const elapsedTime = initialTime - timeLeft;
    const elapsedMinutes = Math.floor(elapsedTime / 60);

    // Only track if more than 1 minute has elapsed
    if (elapsedMinutes >= 1 && isRunning) {
      addPomodoroTime(elapsedMinutes, selectedLabel);

      // Update today's stats
      const updatedStats = getTodayStats();
      setTodayStats(updatedStats);

      // Show brief feedback about tracked time
      if (window.showToast && typeof window.showToast === "function") {
        window.showToast(
          `Tracked ${elapsedMinutes} minute${
            elapsedMinutes > 1 ? "s" : ""
          } to ${selectedLabel} statistics`,
          "pomodoro"
        );
      }
    }

    setIsRunning(false);
    setCurrentState(TIMER_STATES.WORK);
    setTimeLeft(settings.workTime * 60);
    initialTimeRef.current = 0; // Reset the initial time reference

    notifyParent({
      isRunning: false,
      timeLeft: settings.workTime * 60,
      currentState: TIMER_STATES.WORK,
      totalTime: settings.workTime * 60,
      selectedLabel, // Include selected category
    });
  };

  const getCurrentTimerDuration = () => {
    switch (currentState) {
      case TIMER_STATES.WORK:
        return settings.workTime * 60;
      case TIMER_STATES.SHORT_BREAK:
        return settings.shortBreak * 60;
      case TIMER_STATES.LONG_BREAK:
        return settings.longBreak * 60;
      default:
        return settings.workTime * 60;
    }
  };

  const setCustomWorkTime = (minutes) => {
    const newTime = Math.max(1, Math.min(480, minutes)); // 1 min to 8 hours
    setSettings({ ...settings, workTime: newTime });
    setCustomTime(newTime);
    if (currentState === TIMER_STATES.WORK && !isRunning) {
      setTimeLeft(newTime * 60);
    }
    setShowCustomInput(false);
  };

  const handleCustomTimeSubmit = (e) => {
    e.preventDefault();
    setCustomWorkTime(customTime);
  };

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      const updatedLabels = addLabel(newLabel.trim());
      setAvailableLabels(updatedLabels);
      setSelectedLabel(newLabel.trim().toLowerCase());
      setNewLabel("");
      setShowAddLabel(false);
    }
  };

  const handleRemoveLabel = (label) => {
    if (availableLabels.length > 1) {
      const updatedLabels = removeLabel(label);
      setAvailableLabels(updatedLabels);
      if (selectedLabel === label && updatedLabels.length > 0) {
        setSelectedLabel(updatedLabels[0]);
      }
    }
  };

  const handleAddCustomPreset = () => {
    const minutes = parseInt(newPresetTime);
    if (minutes && minutes >= 1 && minutes <= 480) {
      const updatedPresets = addCustomTimePreset(minutes, newPresetEmoji);
      setTimePresets(updatedPresets);
      setNewPresetTime("");
      setNewPresetEmoji("⏰");
      setShowAddPreset(false);
    }
  };

  const handleRemoveCustomPreset = (minutes) => {
    const updatedPresets = removeCustomTimePreset(minutes);
    setTimePresets(updatedPresets);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getStateInfo = () => {
    switch (currentState) {
      case TIMER_STATES.WORK:
        return { label: "Focus Time", color: "bg-red-500", icon: "🍅" };
      case TIMER_STATES.SHORT_BREAK:
        return { label: "Short Break", color: "bg-green-500", icon: "☕" };
      case TIMER_STATES.LONG_BREAK:
        return { label: "Long Break", color: "bg-blue-500", icon: "🌴" };
      default:
        return { label: "Focus Time", color: "bg-red-500", icon: "🍅" };
    }
  };

  const stateInfo = getStateInfo();
  const progress =
    currentState === TIMER_STATES.WORK
      ? ((settings.workTime * 60 - timeLeft) / (settings.workTime * 60)) * 100
      : currentState === TIMER_STATES.SHORT_BREAK
      ? ((settings.shortBreak * 60 - timeLeft) / (settings.shortBreak * 60)) *
        100
      : ((settings.longBreak * 60 - timeLeft) / (settings.longBreak * 60)) *
        100;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">{stateInfo.icon}</span>
          <h2 className="text-xl font-bold text-gray-800">{stateInfo.label}</h2>
          {currentState === TIMER_STATES.WORK && (
            <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-2">
              {settings.workTime}min
            </span>
          )}
        </div>

        {/* Circular Progress */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={stateInfo.color.replace("bg-", "").replace("-500", "")}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              style={{
                transition: "stroke-dashoffset 0.5s ease-in-out",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-gray-600">
                Session {sessionsCompleted + 1}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 mb-4">
          {!isRunning ? (
            <button
              onClick={() => {
                console.log(
                  "🔄 Start button clicked, current isRunning:",
                  isRunning
                );
                startTimer();
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              ▶️ Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              ⏸️ Pause
            </button>
          )}

          <button
            onClick={resetTimer}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            🔄 Reset
          </button>
        </div>

        {/* Today's Study Time */}
        <div className="flex justify-center items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">Today's Study Time:</span>
          <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
            <span className="text-sm font-semibold">
              {Math.floor((todayStats.minutes || 0) / 60)}h{" "}
              {(todayStats.minutes || 0) % 60}m
            </span>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="border-t pt-4 space-y-4">
          {/* Label Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                Study Category
              </h4>
              <button
                type="button"
                onClick={() => setShowAddLabel(!showAddLabel)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Plus size={14} />
                Add New
              </button>
            </div>

            {/* Add New Label */}
            {showAddLabel && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Enter new category name"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-xs"
                  onKeyPress={(e) => e.key === "Enter" && handleAddLabel()}
                />
                <button
                  type="button"
                  onClick={handleAddLabel}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLabel(false);
                    setNewLabel("");
                  }}
                  className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Current Categories (Clickable) */}
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Select a category:</p>
              <div className="flex flex-wrap gap-2">
                {availableLabels.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedLabel(label)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      selectedLabel === label
                        ? "bg-indigo-600 text-white border-2 border-indigo-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
                    }`}
                  >
                    <span>
                      {label.charAt(0).toUpperCase() + label.slice(1)}
                    </span>
                    {availableLabels.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLabel(label);
                        }}
                        className={`ml-1 transition-colors ${
                          selectedLabel === label
                            ? "text-white hover:text-red-200"
                            : "text-red-500 hover:text-red-700"
                        }`}
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Time will be tracked under this category
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                Focus Time Presets
              </h4>
              <button
                type="button"
                onClick={() => setShowAddPreset(!showAddPreset)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Plus size={14} />
                Add New
              </button>
            </div>

            {/* Add New Preset */}
            {showAddPreset && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newPresetEmoji}
                  onChange={(e) => setNewPresetEmoji(e.target.value)}
                  placeholder="📚"
                  className="w-12 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-center text-xs"
                  maxLength="2"
                />
                <input
                  type="number"
                  value={newPresetTime}
                  onChange={(e) => setNewPresetTime(e.target.value)}
                  placeholder="Minutes (1-480)"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-xs"
                  min="1"
                  max="480"
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleAddCustomPreset()
                  }
                />
                <button
                  type="button"
                  onClick={handleAddCustomPreset}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPreset(false);
                    setNewPresetTime("");
                    setNewPresetEmoji("⏰");
                  }}
                  className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Current Time Presets (Clickable) */}
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Select a time preset:</p>
              <div className="grid grid-cols-3 gap-2">
                {timePresets.map((preset) => (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => setCustomWorkTime(preset.minutes)}
                    className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      settings.workTime === preset.minutes
                        ? "bg-red-100 text-red-700 border-2 border-red-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
                    }`}
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.label}</span>
                    {preset.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomPreset(preset.minutes);
                        }}
                        className={`ml-1 transition-colors ${
                          settings.workTime === preset.minutes
                            ? "text-red-700 hover:text-red-900"
                            : "text-red-500 hover:text-red-700"
                        }`}
                      >
                        <Trash2 size={8} />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Time Input */}
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Custom Focus Time
            </h4>
            {!showCustomInput ? (
              <button
                onClick={() => {
                  setShowCustomInput(true);
                  setCustomTime(settings.workTime);
                }}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
              >
                ⚙️ Set Custom Time
              </button>
            ) : (
              <form onSubmit={handleCustomTimeSubmit} className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={customTime}
                    onChange={(e) =>
                      setCustomTime(parseInt(e.target.value) || 1)
                    }
                    className="w-20 px-2 py-1 text-center text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    autoFocus
                  />
                  <span className="text-sm text-gray-600">minutes</span>
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                  >
                    ✓ Set
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                  >
                    ✕ Cancel
                  </button>
                </div>
              </form>
            )}
            {!showCustomInput && ![25, 45, 90].includes(settings.workTime) && (
              <div className="mt-2 text-xs text-indigo-600 font-medium">
                Current: {settings.workTime} minutes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGIcBjuO1fLNfS0EJnzJ8N2QQAoUXrTp66hVFApGn+DyvGIcBjuO1fLNfS0EJnzJ8N2QQAoUXrTp66hVFApGn+DyvGIcBjuO1fLNfS0EJnzJ8N2QQAoUXrTp66hVFApGn+DyvGIcBjuO1fLNfS0EJnzJ8N2QQAoUXrTp66hVFA"
          type="audio/wav"
        />
      </audio>
    </div>
  );
};
