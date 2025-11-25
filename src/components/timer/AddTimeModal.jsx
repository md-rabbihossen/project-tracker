import { Check, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Modal } from "../common/Modal";

export const AddTimeModal = ({
  isOpen,
  onClose,
  onAddTime,
  availableLabels,
  onAddLabel,
  onRemoveLabel,
}) => {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [selectedLabel, setSelectedLabel] = useState(
    availableLabels.includes("programming")
      ? "programming"
      : availableLabels[0] || "study"
  );
  const [newLabel, setNewLabel] = useState("");
  const [showAddLabel, setShowAddLabel] = useState(false);

  // New state for session-based input
  const [inputMode, setInputMode] = useState("direct"); // "direct" or "sessions"
  const [numberOfSessions, setNumberOfSessions] = useState("");
  const [durationPerSession, setDurationPerSession] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    let hoursNum = 0;
    let minutesNum = 0;
    let sessionsToAdd = 1; // Default to 1 session for direct input

    if (inputMode === "direct") {
      // Direct input mode
      hoursNum = parseInt(hours) || 0;
      minutesNum = parseInt(minutes) || 0;
      sessionsToAdd = 1; // Single session
    } else {
      // Sessions mode: calculate total time
      const sessions = parseInt(numberOfSessions) || 0;
      const durationPerSessionNum = parseInt(durationPerSession) || 0;

      if (sessions === 0 || durationPerSessionNum === 0) {
        alert("Please enter valid number of sessions and duration");
        return;
      }

      // Calculate total minutes
      const totalMinutesFromSessions = sessions * durationPerSessionNum;
      hoursNum = Math.floor(totalMinutesFromSessions / 60);
      minutesNum = totalMinutesFromSessions % 60;
      sessionsToAdd = sessions; // Use actual number of sessions
    }

    if (hoursNum === 0 && minutesNum === 0) {
      alert("Please enter a valid time amount");
      return;
    }

    // Convert if minutes are more than 60
    let totalMinutes = minutesNum;
    let totalHours = hoursNum;

    if (totalMinutes >= 60) {
      totalHours += Math.floor(totalMinutes / 60);
      totalMinutes = totalMinutes % 60;
    }

    onAddTime(totalHours, totalMinutes, selectedLabel, sessionsToAdd);

    // Reset form
    setHours("");
    setMinutes("");
    setNumberOfSessions("");
    setDurationPerSession("");
    setSelectedLabel(
      availableLabels.includes("programming")
        ? "programming"
        : availableLabels[0] || "study"
    );
    onClose();
  };

  const handleCategoryClick = (label) => {
    // If clicking on the already selected label, just update selection (no auto-submit)
    if (selectedLabel === label) {
      setSelectedLabel(label);
      return;
    }

    // If clicking on a different category and there's time entered, auto-submit
    let hoursNum = 0;
    let minutesNum = 0;
    let sessionsToAdd = 1; // Default to 1 session

    if (inputMode === "direct") {
      hoursNum = parseInt(hours) || 0;
      minutesNum = parseInt(minutes) || 0;
      sessionsToAdd = 1; // Single session
    } else {
      // Sessions mode
      const sessions = parseInt(numberOfSessions) || 0;
      const durationPerSessionNum = parseInt(durationPerSession) || 0;
      const totalMinutesFromSessions = sessions * durationPerSessionNum;
      hoursNum = Math.floor(totalMinutesFromSessions / 60);
      minutesNum = totalMinutesFromSessions % 60;
      sessionsToAdd = sessions; // Use actual number of sessions
    }

    if (hoursNum > 0 || minutesNum > 0) {
      // Convert if minutes are more than 60
      let totalMinutes = minutesNum;
      let totalHours = hoursNum;

      if (totalMinutes >= 60) {
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60;
      }

      onAddTime(totalHours, totalMinutes, label, sessionsToAdd);

      // Reset form
      setHours("");
      setMinutes("");
      setNumberOfSessions("");
      setDurationPerSession("");
      setSelectedLabel(
        availableLabels.includes("programming")
          ? "programming"
          : availableLabels[0] || "study"
      );
      onClose();
    } else {
      // If no time entered, just update selection
      setSelectedLabel(label);
    }
  };

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      onAddLabel(newLabel.trim());
      setSelectedLabel(newLabel.trim().toLowerCase());
      setNewLabel("");
      setShowAddLabel(false);
    }
  };

  const handleRemoveLabel = (label) => {
    if (availableLabels.length > 1) {
      const updatedLabels = onRemoveLabel(label);
      if (selectedLabel === label && updatedLabels.length > 0) {
        setSelectedLabel(updatedLabels[0]);
      }
    }
  };

  const resetForm = () => {
    setHours("");
    setMinutes("");
    setNumberOfSessions("");
    setDurationPerSession("");
    setInputMode("direct");
    setSelectedLabel(
      availableLabels.includes("programming")
        ? "programming"
        : availableLabels[0] || "study"
    );
    setNewLabel("");
    setShowAddLabel(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Study Time">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Mode Toggle */}
        <div className="flex items-center justify-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setInputMode("direct")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              inputMode === "direct"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Direct Time
          </button>
          <button
            type="button"
            onClick={() => setInputMode("sessions")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              inputMode === "sessions"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Multiple Sessions
          </button>
        </div>

        {/* Time Input - Direct Mode */}
        {inputMode === "direct" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Time Spent</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours
                </label>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-center text-lg"
                  min="0"
                  max="24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minutes
                </label>
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-center text-lg"
                  min="0"
                  autoFocus
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              💡 If minutes are more than 60, they will be automatically
              converted to hours and minutes
            </p>
          </div>
        )}

        {/* Time Input - Sessions Mode */}
        {inputMode === "sessions" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Session Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Sessions
                </label>
                <input
                  type="number"
                  value={numberOfSessions}
                  onChange={(e) => setNumberOfSessions(e.target.value)}
                  placeholder="e.g., 4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-center text-lg"
                  min="1"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration per Session (min)
                </label>
                <input
                  type="number"
                  value={durationPerSession}
                  onChange={(e) => setDurationPerSession(e.target.value)}
                  placeholder="e.g., 30"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-center text-lg"
                  min="1"
                />
              </div>
            </div>
            {/* Total Time Preview */}
            {numberOfSessions && durationPerSession && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <p className="text-sm text-indigo-700 text-center">
                  <span className="font-semibold">Total Time: </span>
                  {Math.floor(
                    (parseInt(numberOfSessions) *
                      parseInt(durationPerSession)) /
                      60
                  )}{" "}
                  hours{" "}
                  {(parseInt(numberOfSessions) * parseInt(durationPerSession)) %
                    60}{" "}
                  minutes
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              💡 Example: 4 sessions × 30 min = 2 hours total study time
            </p>
          </div>
        )}

        {/* Label Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Category</h3>
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
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                onKeyPress={(e) => e.key === "Enter" && handleAddLabel()}
              />
              <button
                type="button"
                onClick={handleAddLabel}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddLabel(false);
                  setNewLabel("");
                }}
                className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Current Categories (Clickable) */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Select a category:</p>
            <div className="flex flex-wrap gap-2">
              {availableLabels.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleCategoryClick(label)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                    selectedLabel === label
                      ? "bg-indigo-600 text-white border-2 border-indigo-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <span>{label.charAt(0).toUpperCase() + label.slice(1)}</span>
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
                      <Trash2 size={12} />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Add Time
          </button>
        </div>
      </form>
    </Modal>
  );
};
