import { useEffect, useState } from "react";
import { ClockIcon } from "../Icons";

export const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timerId = setInterval(() => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const difference = midnight - now;
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((difference / (1000 * 60)) % 60)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((difference / 1000) % 60)
        .toString()
        .padStart(2, "0");
      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 flex items-center justify-center">
      <ClockIcon className="w-6 h-6 mr-3 text-red-600" />
      <div className="text-center">
        <div className="text-lg font-bold text-red-700 font-mono">
          {timeLeft}
        </div>
        <div className="text-xs text-red-600 font-medium">Time left today</div>
      </div>
    </div>
  );
};
