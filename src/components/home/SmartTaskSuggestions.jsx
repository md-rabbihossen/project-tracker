import { motion } from "framer-motion";

const SmartTaskSuggestions = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
    >
      <div className="text-center text-gray-500 text-sm">
        Task suggestions feature will be enhanced in future updates
      </div>
    </motion.div>
  );
};

export default SmartTaskSuggestions;
