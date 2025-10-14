import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vndlnqetnjelddfanmqq.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuZGxucWV0bmplbGRkZmFubXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTk5MDAsImV4cCI6MjA3NjAzNTkwMH0.FQVnimgJEDDRKIh3UKWE6cansqWFjiJNeJ1MgapCFNo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("🔍 Testing Supabase connection...\n");

  // Test 1: Simple ping
  try {
    const { data, error } = await supabase.from("users").select("count");
    if (error) {
      console.error("❌ Error connecting:", error);
    } else {
      console.log("✅ Connection successful!");
      console.log("📊 Users table accessible\n");
    }
  } catch (e) {
    console.error("❌ Connection failed:", e);
  }

  // Test 2: Try to insert a test roadmap
  const testUserId = "429084a5-2ecc-43af-87ed-8963779e6011";
  console.log("🔄 Testing INSERT with user_id:", testUserId);

  try {
    const { data, error } = await supabase.from("roadmap").upsert(
      {
        user_id: testUserId,
        roadmap_data: {
          test: "Hello from test script",
          timestamp: new Date().toISOString(),
        },
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("❌ Insert error:", error);
      console.log("Error details:", JSON.stringify(error, null, 2));
    } else {
      console.log("✅ Insert successful!");
      console.log("Data:", data);
    }
  } catch (e) {
    console.error("❌ Insert failed:", e);
  }

  // Test 3: Try to read back
  console.log("\n🔍 Testing SELECT...");
  try {
    const { data, error } = await supabase
      .from("roadmap")
      .select("*")
      .eq("user_id", testUserId)
      .maybeSingle();

    if (error) {
      console.error("❌ Select error:", error);
    } else {
      console.log("✅ Select successful!");
      console.log("Data:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("❌ Select failed:", e);
  }
}

testConnection();
