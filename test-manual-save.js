import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vndlnqetnjelddfanmqq.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuZGxucWV0bmplbGRkZmFubXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTk5MDAsImV4cCI6MjA3NjAzNTkwMH0.FQVnimgJEDDRKIh3UKWE6cansqWFjiJNeJ1MgapCFNo";

const supabase = createClient(supabaseUrl, supabaseKey);

const testUserId = "429084a5-2ecc-43af-87ed-8963779e6011";

async function testDataSave() {
  console.log("🧪 Testing manual data save to Supabase...\n");

  // Test 1: Save a simple task
  console.log("1️⃣ Testing today_tasks save...");
  try {
    const testTasks = [
      {
        id: "test-1",
        text: "Test task from script",
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ];

    const { data, error } = await supabase.from("today_tasks").upsert(
      {
        user_id: testUserId,
        tasks: testTasks,
        completed_one_time_tasks: [],
        last_reset_date: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("❌ Error saving tasks:", error);
      console.log("Error details:", JSON.stringify(error, null, 2));
    } else {
      console.log("✅ Tasks saved successfully!");
      console.log("Response:", data);
    }
  } catch (e) {
    console.error("❌ Exception:", e);
  }

  // Test 2: Read back the data
  console.log("\n2️⃣ Testing data retrieval...");
  try {
    const { data, error } = await supabase
      .from("today_tasks")
      .select("*")
      .eq("user_id", testUserId)
      .maybeSingle();

    if (error) {
      console.error("❌ Error reading tasks:", error);
    } else {
      console.log("✅ Tasks retrieved successfully!");
      console.log("Data:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("❌ Exception:", e);
  }

  // Test 3: Check all tables
  console.log("\n3️⃣ Checking all tables for user data...");
  const tables = [
    "roadmap",
    "today_tasks",
    "books",
    "pomodoro_stats",
    "daily_progress",
    "user_goals",
    "app_settings",
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact" })
        .eq("user_id", testUserId);

      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(
          `✅ ${table}: ${count} row(s) - ${
            data?.length > 0 ? "Has data" : "Empty"
          }`
        );
      }
    } catch (e) {
      console.log(`❌ ${table}: Exception - ${e.message}`);
    }
  }
}

testDataSave();
