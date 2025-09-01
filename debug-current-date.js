// Debug script to test current date calculation
const today = new Date(); // This will be the current date when run
console.log("Current date:", today.toISOString().split("T")[0]);
console.log("Day of week:", today.getDay()); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

const dayOfWeek = today.getDay();
const daysToSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
const saturday = new Date(today);
saturday.setDate(today.getDate() - daysToSaturday);
const weekKey = saturday.toISOString().split("T")[0];

console.log("Week key:", weekKey);
console.log("Days to Saturday:", daysToSaturday);

// Test what happens if it's exactly Saturday
const testSaturday = new Date("2025-08-24");
console.log("\nTesting 2025-08-24 (should be Saturday):");
console.log("Is Saturday?", testSaturday.getDay() === 6);
const satDayOfWeek = testSaturday.getDay();
const satDaysToSaturday = satDayOfWeek === 6 ? 0 : satDayOfWeek + 1;
const satWeekStart = new Date(testSaturday);
satWeekStart.setDate(testSaturday.getDate() - satDaysToSaturday);
console.log(
  "Week start for 2025-08-24:",
  satWeekStart.toISOString().split("T")[0]
);
