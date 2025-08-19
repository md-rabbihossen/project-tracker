import { motion } from "framer-motion";
import { TASK_CATEGORIES } from "../../utils/taskCategories";

export const TaskCategories = ({
  selectedCategory,
  onCategoryChange,
  taskCounts = {},
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      {TASK_CATEGORIES.map((category) => {
        const count = taskCounts[category.id] || 0;
        const isSelected = selectedCategory === category.id;

        return (
          <motion.button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              isSelected
                ? "bg-indigo-600 text-white shadow-md scale-105"
                : `${category.color} hover:scale-105`
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg">{category.icon}</span>
            <span>{category.name}</span>
            {count > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-white/80 text-gray-700"
                }`}
              >
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
