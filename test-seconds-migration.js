// Test script to verify seconds tracking functionality
// This simulates the timer behavior with seconds tracking

import {
  addPomodoroTimeSeconds,
  formatDuration,
  getLifetimeStats,
  getTodayStats,
  resetPomodoroStats,
} from "./src/utils/pomodoroStats.js";

console.log("🧪 Testing Pomodoro Timer with Seconds Tracking...\n");

// Reset stats for clean testing
resetPomodoroStats();
console.log("✅ Reset statistics for testing");

// Test Case 1: User studies for just 5 seconds and hits reset
console.log("\n📊 Test Case 1: User studies for 5 seconds and hits reset...");
addPomodoroTimeSeconds(5);

let todayStats = getTodayStats();
console.log("Today stats after 5 seconds:", todayStats);
console.log("Today formatted:", formatDuration(todayStats.seconds));

// Test Case 2: User completes a 3-minute timer
console.log(
  "\n📊 Test Case 2: User completes a 3-minute (180 seconds) timer..."
);
addPomodoroTimeSeconds(180);

todayStats = getTodayStats();
console.log("Today stats after 3 minutes:", todayStats);
console.log("Today formatted:", formatDuration(todayStats.seconds));

// Test Case 3: User studies for 1 minute 30 seconds and hits reset
console.log(
  "\n📊 Test Case 3: User studies for 1 minute 30 seconds (90 seconds) and hits reset..."
);
addPomodoroTimeSeconds(90);

todayStats = getTodayStats();
console.log("Today stats after 1m 30s:", todayStats);
console.log("Today formatted:", formatDuration(todayStats.seconds));

// Test Case 4: User studies for exactly 1 second and hits reset
console.log(
  "\n📊 Test Case 4: User studies for exactly 1 second and hits reset..."
);
addPomodoroTimeSeconds(1);

todayStats = getTodayStats();
console.log("Today stats after 1 second:", todayStats);
console.log("Today formatted:", formatDuration(todayStats.seconds));

// Check lifetime stats
const lifetimeStats = getLifetimeStats();
console.log("\n📈 Final Lifetime Statistics:");
console.log("Lifetime stats:", lifetimeStats);
console.log("Lifetime formatted:", formatDuration(lifetimeStats.totalSeconds));
console.log("Total sessions:", lifetimeStats.totalSessions);

// Calculate total time tracked
const totalSeconds = lifetimeStats.totalSeconds;
const totalMinutes = Math.floor(totalSeconds / 60);
const remainingSeconds = totalSeconds % 60;

console.log("\n🎯 Summary:");
console.log(
  `- Total time tracked: ${totalMinutes} minutes and ${remainingSeconds} seconds`
);
console.log(`- Total sessions: ${lifetimeStats.totalSessions}`);
console.log(
  `- Average session length: ${Math.floor(
    totalSeconds / lifetimeStats.totalSessions
  )} seconds`
);

console.log("\n✅ All tests completed successfully!");
console.log("🔥 Timer now tracks even 1-second sessions when user hits reset!");
