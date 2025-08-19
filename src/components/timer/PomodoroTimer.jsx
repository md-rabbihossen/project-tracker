import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const TIMER_STATES = {
  WORK: "work",
  SHORT_BREAK: "shortBreak",
  LONG_BREAK: "longBreak",
};

export const PomodoroTimer = ({ onSessionComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [currentState, setCurrentState] = useState(TIMER_STATES.WORK);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [settings, setSettings] = useState({
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
  });

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const handleSessionEnd = useCallback(() => {
    setIsRunning(false);

    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play();
    }

    if (currentState === TIMER_STATES.WORK) {
      const newSessionCount = sessionsCompleted + 1;
      setSessionsCompleted(newSessionCount);

      // Notify parent component about completed work session
      if (onSessionComplete) {
        onSessionComplete(settings.workTime);
      }

      // Determine next break type
      if (newSessionCount % settings.sessionsUntilLongBreak === 0) {
        setCurrentState(TIMER_STATES.LONG_BREAK);
        setTimeLeft(settings.longBreak * 60);
      } else {
        setCurrentState(TIMER_STATES.SHORT_BREAK);
        setTimeLeft(settings.shortBreak * 60);
      }
    } else {
      // Break ended, start work session
      setCurrentState(TIMER_STATES.WORK);
      setTimeLeft(settings.workTime * 60);
    }
  }, [currentState, sessionsCompleted, settings, onSessionComplete]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionEnd();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, handleSessionEnd]);

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    setIsRunning(false);
    setCurrentState(TIMER_STATES.WORK);
    setTimeLeft(settings.workTime * 60);
  };

  const skipSession = () => {
    setIsRunning(false);
    handleSessionEnd();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getStateInfo = () => {
    switch (currentState) {
      case TIMER_STATES.WORK:
        return { label: "Focus Time", color: "bg-red-500", icon: "🍅" };
      case TIMER_STATES.SHORT_BREAK:
        return { label: "Short Break", color: "bg-green-500", icon: "☕" };
      case TIMER_STATES.LONG_BREAK:
        return { label: "Long Break", color: "bg-blue-500", icon: "🌴" };
      default:
        return { label: "Focus Time", color: "bg-red-500", icon: "🍅" };
    }
  };

  const stateInfo = getStateInfo();
  const progress =
    currentState === TIMER_STATES.WORK
      ? ((settings.workTime * 60 - timeLeft) / (settings.workTime * 60)) * 100
      : currentState === TIMER_STATES.SHORT_BREAK
      ? ((settings.shortBreak * 60 - timeLeft) / (settings.shortBreak * 60)) *
        100
      : ((settings.longBreak * 60 - timeLeft) / (settings.longBreak * 60)) *
        100;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">{stateInfo.icon}</span>
          <h2 className="text-xl font-bold text-gray-800">{stateInfo.label}</h2>
        </div>

        {/* Circular Progress */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              stroke={stateInfo.color.replace("bg-", "").replace("-500", "")}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100),
              }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-gray-600">
                Session {sessionsCompleted + 1}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 mb-4">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              ▶️ Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              ⏸️ Pause
            </button>
          )}

          <button
            onClick={resetTimer}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            🔄 Reset
          </button>

          <button
            onClick={skipSession}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            ⏭️ Skip
          </button>
        </div>

        {/* Session Counter */}
        <div className="flex justify-center items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">Sessions completed:</span>
          <div className="flex gap-1">
            {Array.from({ length: settings.sessionsUntilLongBreak }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < sessionsCompleted % settings.sessionsUntilLongBreak
                    ? "bg-red-500"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Settings */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => {
                setSettings({ ...settings, workTime: 25 });
                if (currentState === TIMER_STATES.WORK && !isRunning) {
                  setTimeLeft(25 * 60);
                }
              }}
              className={`p-2 rounded ${
                settings.workTime === 25 ? "bg-red-100" : "bg-gray-100"
              }`}
            >
              🍅 25min
            </button>
            <button
              onClick={() => {
                setSettings({ ...settings, workTime: 45 });
                if (currentState === TIMER_STATES.WORK && !isRunning) {
                  setTimeLeft(45 * 60);
                }
              }}
              className={`p-2 rounded ${
                settings.workTime === 45 ? "bg-red-100" : "bg-gray-100"
              }`}
            >
              📚 45min
            </button>
            <button
              onClick={() => {
                setSettings({ ...settings, workTime: 90 });
                if (currentState === TIMER_STATES.WORK && !isRunning) {
                  setTimeLeft(90 * 60);
                }
              }}
              className={`p-2 rounded ${
                settings.workTime === 90 ? "bg-red-100" : "bg-gray-100"
              }`}
            >
              🎯 90min
            </button>
          </div>
        </div>
      </div>

      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGIcBjuO1fLNfS0EJnzJ8N2QQAoUXrTp66hVFApGn+DyvGIcBjuO1fLNfS0EJnzJ8N2QQAoUXrTp66hVFApGn+DyvGIcBjuO1fLNfS0EJnzJ8N2QQAoUXrTp66hVFApGn+DyvGIcBjuO1fLNfS0EJnzJ8N2QQAoUXrTp66hVFA"
          type="audio/wav"
        />
      </audio>
    </div>
  );
};
