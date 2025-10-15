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
      <div className="mb-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
        >
          <PlusCircleIcon className="w-5 h-5" />
          Add New Task
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
