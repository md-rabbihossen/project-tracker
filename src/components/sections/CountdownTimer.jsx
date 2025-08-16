import { useState, useEffect } from "react";
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
    <div className="text-sm font-mono text-gray-600 flex items-center">
      <ClockIcon className="w-5 h-5 mr-2 text-gray-500" />
      {timeLeft}
    </div>
  );
};
