import toast from "react-hot-toast";

export const showSuccessToast = (message) => {
  toast.success(message, {
    duration: 3000,
    style: {
      background: "#10B981",
      color: "#fff",
      fontWeight: "500",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#10B981",
    },
  });
};

export const showErrorToast = (message) => {
  toast.error(message, {
    duration: 4000,
    style: {
      background: "#EF4444",
      color: "#fff",
      fontWeight: "500",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#EF4444",
    },
  });
};

export const showInfoToast = (message) => {
  toast(message, {
    duration: 3000,
    icon: "💡",
    style: {
      background: "#3B82F6",
      color: "#fff",
      fontWeight: "500",
    },
  });
};

export const showAchievementToast = (title, description) => {
  toast.custom(
    (t) =>
      `<div class="${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5">
      <div class="flex-1 w-0 p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <span class="text-2xl">🏆</span>
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium text-white">Achievement Unlocked!</p>
            <p class="text-sm font-bold text-white">${title}</p>
            <p class="text-xs text-purple-100 mt-1">${description}</p>
          </div>
        </div>
      </div>
    </div>`,
    {
      duration: 6000,
    }
  );
};

export const showProgressToast = (taskName, progress) => {
  toast.success(
    `Progress updated: ${taskName} - ${progress.toFixed(1)}% complete`,
    {
      duration: 4000,
      icon: "📈",
    }
  );
};

export const showPomodoroToast = (message, type = "success") => {
  const config = {
    duration: 2500,
    style: {
      fontWeight: "500",
    },
  };

  if (type === "success") {
    toast.success(message, {
      ...config,
      icon: "⏱️",
      style: {
        ...config.style,
        background: "#10B981",
        color: "#fff",
      },
    });
  } else if (type === "info") {
    toast(message, {
      ...config,
      icon: "⏱️",
      style: {
        ...config.style,
        background: "#3B82F6",
        color: "#fff",
      },
    });
  }
};

// Global toast function for use across the app
if (typeof window !== "undefined") {
  window.showToast = (message, type = "success") => {
    if (type === "success") {
      showSuccessToast(message);
    } else if (type === "error") {
      showErrorToast(message);
    } else if (type === "info") {
      showInfoToast(message);
    } else if (type === "pomodoro") {
      showPomodoroToast(message, "success");
    }
  };
}
