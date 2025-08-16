import { XCircleIcon } from "../Icons";

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop z-50 flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full animate-slide-up custom-scrollbar max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
