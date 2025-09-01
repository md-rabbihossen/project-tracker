// Debug script to test weekly date calculation
const getWeekStartDate = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // Days to go back to Saturday
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysToSaturday);
  return saturday.toISOString().split("T")[0];
};

// Test for different days of the week
const testDates = [
  new Date("2025-08-16"), // Saturday
  new Date("2025-08-17"), // Sunday
  new Date("2025-08-18"), // Monday
  new Date("2025-08-19"), // Tuesday
  new Date("2025-08-20"), // Wednesday
  new Date("2025-08-21"), // Thursday
  new Date("2025-08-22"), // Friday
  new Date("2025-08-23"), // Saturday (next week)
];

console.log("Testing weekly date calculation:");
testDates.forEach((date) => {
  const dayOfWeek = date.getDay();
  const daysToSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  const saturday = new Date(date);
  saturday.setDate(date.getDate() - daysToSaturday);
  const weekKey = saturday.toISOString().split("T")[0];

  console.log(
    `${date.toISOString().split("T")[0]} (${
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek]
    }) -> Week: ${weekKey}`
  );
});
