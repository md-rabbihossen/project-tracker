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
    availableLabels.includes("programming") ? "programming" : (availableLabels[0] || "study")
  );
  const [newLabel, setNewLabel] = useState("");
  const [showAddLabel, setShowAddLabel] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;

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

    onAddTime(totalHours, totalMinutes, selectedLabel);

    // Reset form
    setHours("");
    setMinutes("");
    setSelectedLabel(availableLabels.includes("programming") ? "programming" : (availableLabels[0] || "study"));
    onClose();
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
    setSelectedLabel(availableLabels.includes("programming") ? "programming" : (availableLabels[0] || "study"));
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
        {/* Time Input */}
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
            💡 If minutes are more than 60, they will be automatically converted
            to hours and minutes
          </p>
        </div>

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
                  onClick={() => setSelectedLabel(label)}
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
