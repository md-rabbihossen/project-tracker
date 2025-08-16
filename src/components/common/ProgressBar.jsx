export const ProgressBar = ({ percentage }) => {
  const displayPercentage = isNaN(percentage)
    ? 0
    : Math.min(100, Math.max(0, percentage));

  let barColor = "bg-red-500";
  if (displayPercentage >= 80) barColor = "bg-green-500";
  else if (displayPercentage >= 60) barColor = "bg-blue-500";
  else if (displayPercentage >= 40) barColor = "bg-yellow-400";
  else if (displayPercentage >= 20) barColor = "bg-orange-500";

  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div
        className={`${barColor} h-3 rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${displayPercentage}%` }}
      ></div>
    </div>
  );
};
