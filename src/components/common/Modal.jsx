import { XCircleIcon } from "../Icons";
import { Portal } from "./Portal";

export const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 animate-fade-in">
        <div className="absolute inset-0" onClick={onClose} />
        <div
          className={`relative bg-white rounded-2xl p-6 shadow-2xl ${sizeClasses[size]} w-full animate-slide-up custom-scrollbar max-h-[90vh] overflow-y-auto border border-gray-200`}
        >
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
    </Portal>
  );
};
