// Direct import test - simulating what the app does
import { syncData } from "./src/services/supabase.js";

const testUserId = "429084a5-2ecc-43af-87ed-8963779e6011";

// Make sure localStorage has the userId (simulating logged-in state)
global.localStorage = {
  getItem: (key) => {
    if (key === "userId") return testUserId;
    return null;
  },
  setItem: () => {},
  removeItem: () => {},
};

async function testDirectSync() {
  console.log("🧪 Testing direct sync functions from supabase.js...\n");

  // Test 1: Save roadmap
  console.log("1️⃣ Testing saveRoadmap...");
  try {
    const testRoadmap = {
      phases: [
        {
          name: "Test Phase",
          weeks: [
            {
              topics: [
                {
                  id: "1",
                  text: "Test Topic",
                  type: "course",
                  completedMinutes: 10,
                  totalMinutes: 60,
                },
              ],
            },
          ],
        },
      ],
      startDate: new Date().toISOString(),
    };

    await syncData.saveRoadmap(testRoadmap);
    console.log("✅ Roadmap saved!\n");
  } catch (e) {
    console.error("❌ Error:", e.message, "\n");
  }

  // Test 2: Save today tasks
  console.log("2️⃣ Testing saveTodayTasks...");
  try {
    const testTasks = [
      { id: "1", text: "Test task from direct sync", completed: false },
    ];

    await syncData.saveTodayTasks(testTasks, [], new Date().toISOString());
    console.log("✅ Tasks saved!\n");
  } catch (e) {
    console.error("❌ Error:", e.message, "\n");
  }

  // Test 3: Save books
  console.log("3️⃣ Testing saveBooks...");
  try {
    const testBooks = [
      { id: "1", name: "Test Book", pagesRead: 10, totalPages: 200 },
    ];

    await syncData.saveBooks(testBooks);
    console.log("✅ Books saved!\n");
  } catch (e) {
    console.error("❌ Error:", e.message, "\n");
  }

  // Test 4: Verify all data was saved
  console.log("4️⃣ Verifying saved data...");
  try {
    const roadmap = await syncData.getRoadmap();
    const tasks = await syncData.getTodayTasks();
    const books = await syncData.getBooks();

    console.log("📊 Results:");
    console.log("  Roadmap:", roadmap ? "✅ Retrieved" : "❌ Not found");
    console.log("  Tasks:", tasks?.tasks?.length || 0, "tasks");
    console.log("  Books:", books?.length || 0, "books");
  } catch (e) {
    console.error("❌ Error:", e.message);
  }
}

testDirectSync();
