import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { TASK_CATEGORIES } from "../../utils/taskCategories";
import { ChevronDownIcon } from "../Icons";

export const MobileFilter = ({
  selectedCategory,
  onCategoryChange,
  filterType,
  onFilterChange,
  sortType,
  onSortChange,
  taskCounts = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const filterOptions = [
    { value: "all", label: "All Tasks", icon: "📋" },
    { value: "completed", label: "Completed", icon: "✅" },
    { value: "pending", label: "Pending", icon: "⏳" },
    { value: "high-priority", label: "High Priority", icon: "🔥" },
  ];

  const sortOptions = [
    { value: "priority", label: "Priority", icon: "🎯" },
    { value: "name", label: "Name (A-Z)", icon: "🔤" },
    { value: "created", label: "Date Added", icon: "📅" },
  ];

  const getCurrentFilterLabel = () => {
    const currentFilter = filterOptions.find((f) => f.value === filterType);
    const currentCategory = TASK_CATEGORIES.find(
      (c) => c.id === selectedCategory
    );

    if (selectedCategory !== "all" && filterType !== "all") {
      return `${currentCategory?.name} • ${currentFilter?.label}`;
    } else if (selectedCategory !== "all") {
      return currentCategory?.name;
    } else if (filterType !== "all") {
      return currentFilter?.label;
    } else {
      return "All Tasks";
    }
  };

  const getCurrentFilterIcon = () => {
    if (selectedCategory !== "all") {
      const currentCategory = TASK_CATEGORIES.find(
        (c) => c.id === selectedCategory
      );
      return currentCategory?.icon;
    } else {
      const currentFilter = filterOptions.find((f) => f.value === filterType);
      return currentFilter?.icon;
    }
  };

  return (
    <div className="relative mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{getCurrentFilterIcon()}</span>
          <span className="font-medium text-gray-900">
            {getCurrentFilterLabel()}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20"
          >
            <div className="p-4 max-h-80 overflow-y-auto">
              {/* Filter Section */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Filter
                </div>
                <div className="space-y-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onFilterChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-3 ${
                        filterType === option.value
                          ? "bg-green-100 text-green-700 font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className="text-base">{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories Section */}
              <div className="mb-4 pt-4 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Categories
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TASK_CATEGORIES.map((category) => {
                    const count = taskCounts[category.id] || 0;
                    const isSelected = selectedCategory === category.id;

                    return (
                      <motion.button
                        key={category.id}
                        onClick={() => {
                          onCategoryChange(category.id);
                          setIsOpen(false);
                        }}
                        className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-base">{category.icon}</span>
                        <div className="flex-1 text-left">
                          <span className="block">{category.name}</span>
                          {count > 0 && (
                            <span
                              className={`text-xs ${
                                isSelected ? "text-indigo-200" : "text-gray-500"
                              }`}
                            >
                              {count} tasks
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Sort By
                </div>
                <div className="space-y-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-3 ${
                        sortType === option.value
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className="text-base">{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
