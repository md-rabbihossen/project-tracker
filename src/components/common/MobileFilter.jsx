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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200/50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
      >
        <span className="text-lg group-hover:scale-110 transition-transform">
          {getCurrentFilterIcon()}
        </span>
        <span className="font-medium text-gray-700 text-sm">
          {getCurrentFilterLabel()}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full mt-3 right-0 w-80 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-5 max-h-[32rem] overflow-y-auto">
                {/* Filter Section */}
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    Filter Tasks
                  </h3>
                  <div className="space-y-1.5">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onFilterChange(option.value);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all duration-200 flex items-center gap-3 ${
                          filterType === option.value
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 font-semibold scale-[1.02]"
                            : "hover:bg-gray-50 text-gray-700 hover:translate-x-1"
                        }`}
                      >
                        <span className="text-lg">{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories Section */}
                <div className="mb-5 pt-5 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    Categories
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
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
                          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30 scale-105"
                              : "bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 hover:scale-105"
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-2xl">{category.icon}</span>
                          <div className="text-center">
                            <span className="block text-xs font-semibold">
                              {category.name}
                            </span>
                            {count > 0 && (
                              <span
                                className={`text-[10px] ${
                                  isSelected
                                    ? "text-indigo-200"
                                    : "text-gray-500"
                                }`}
                              >
                                {count} {count === 1 ? "task" : "tasks"}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort Section */}
                <div className="pt-5 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    Sort By
                  </h3>
                  <div className="space-y-1.5">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSortChange(option.value);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all duration-200 flex items-center gap-3 ${
                          sortType === option.value
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 font-semibold scale-[1.02]"
                            : "hover:bg-gray-50 text-gray-700 hover:translate-x-1"
                        }`}
                      >
                        <span className="text-lg">{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
