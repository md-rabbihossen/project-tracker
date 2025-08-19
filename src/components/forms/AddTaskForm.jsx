import { useState } from "react";
import { PlusCircleIcon } from "../Icons";
import { AddTaskModal } from "../modals/AddTaskModal";

export const AddTaskForm = ({ onAddTask, isTodaySection = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddTask = (taskData) => {
    if (isTodaySection) {
      onAddTask(taskData);
    } else {
      onAddTask(taskData.text, taskData.isDaily);
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Add Task
        </button>
      </div>

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={handleAddTask}
        isTodaySection={isTodaySection}
      />
    </>
  );
};
