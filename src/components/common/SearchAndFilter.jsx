import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export const SearchAndFilter = ({
  onSearch,
  onFilterChange,
  onSortChange,
  searchTerm = "",
  currentFilter = "all",
  currentSort = "priority",
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterOptions = [
    { value: "all", label: "All Tasks", icon: "📋" },
    { value: "completed", label: "Completed", icon: "✅" },
    { value: "pending", label: "Pending", icon: "⏳" },
    { value: "high-priority", label: "High Priority", icon: "🔥" },
    { value: "daily", label: "Daily Tasks", icon: "🔄" },
    { value: "weekly", label: "Weekly Tasks", icon: "📅" },
  ];

  const sortOptions = [
    { value: "priority", label: "Priority", icon: "🎯" },
    { value: "date", label: "Date Added", icon: "📅" },
    { value: "name", label: "Name (A-Z)", icon: "🔤" },
    { value: "progress", label: "Progress", icon: "📊" },
  ];

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-lg">
              🔍
            </span>
            {searchTerm && (
              <button
                onClick={() => onSearch("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span>🔽</span>
            <span>Filter</span>
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48"
              >
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                    Filter By
                  </div>
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onFilterChange(option.value);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                        currentFilter === option.value
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}

                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                      Sort By
                    </div>
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSortChange(option.value);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                          currentSort === option.value
                            ? "bg-green-100 text-green-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange("high-priority")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentFilter === "high-priority"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            🔥 Priority
          </button>
          <button
            onClick={() => onFilterChange("pending")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentFilter === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            ⏳ Pending
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(currentFilter !== "all" || searchTerm) && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
          <span className="text-sm text-gray-600">Active filters:</span>
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              Search: "{searchTerm}"
              <button
                onClick={() => onSearch("")}
                className="hover:text-blue-900"
              >
                ✕
              </button>
            </span>
          )}
          {currentFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
              {filterOptions.find((f) => f.value === currentFilter)?.label}
              <button
                onClick={() => onFilterChange("all")}
                className="hover:text-purple-900"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
