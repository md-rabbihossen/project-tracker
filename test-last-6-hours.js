// Test the Last 6 Hours functionality
import {
  addPomodoroTime,
  getLast6HoursStats,
  getPomodoroStats,
} from "./src/utils/pomodoroStats.js";

// Initialize or get existing stats
console.log("📊 Testing Last 6 Hours functionality...");

// Test adding some sessions
console.log("\n🧪 Adding test sessions...");
addPomodoroTime(25, "study");
addPomodoroTime(30, "programming");
addPomodoroTime(15, "reading");

// Check the stats
const stats = getPomodoroStats();
console.log("\n📈 Current timestamped sessions:");
console.log(stats.timestampedSessions);

// Get last 6 hours stats
const last6Hours = getLast6HoursStats();
console.log("\n⏰ Last 6 hours stats:");
console.log(`Total minutes: ${last6Hours.minutes}`);
console.log(`Total sessions: ${last6Hours.sessions}`);
console.log(`Labels breakdown:`, last6Hours.labels);

console.log(
  "\n✅ Test completed! The Last 6 Hours feature should now track time accurately."
);
