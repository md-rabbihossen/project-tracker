import { useState } from "react";
import { generateUserId, syncData } from "../services/supabase";

function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateNew = async () => {
    if (!name.trim()) {
      alert("Please enter your name first");
      return;
    }

    setIsLoading(true);
    try {
      const newId = generateUserId();
      localStorage.setItem("userId", newId);
      localStorage.setItem("userName", name);

      // Create user in database
      await syncData.createOrUpdateUser(newId, name);

      console.log("✅ New user created:", newId);
      onLogin(newId, name);
    } catch (error) {
      console.error("❌ Error creating user:", error);
      alert("Failed to create user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!userId.trim()) {
      alert("Please enter a User ID or generate a new one");
      return;
    }

    setIsLoading(true);
    try {
      localStorage.setItem("userId", userId.trim());
      localStorage.setItem("userName", name.trim());

      // Update user in database
      await syncData.createOrUpdateUser(userId.trim(), name.trim());

      console.log("✅ User logged in:", userId.trim());
      onLogin(userId.trim(), name.trim());
    } catch (error) {
      console.error("❌ Error logging in:", error);
      alert("Failed to log in. Please check your User ID.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Progress Tracker
          </h1>
          <p className="text-gray-600">Track your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              disabled={isLoading}
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateNew}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "🎉 Generate New User ID"}
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-300 w-full"></div>
            <span className="absolute bg-white px-4 text-gray-500 text-sm">
              OR
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Existing User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your User ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Continue with Existing ID"}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 text-center">
            <strong>💡 Tip:</strong> Save your User ID to access your data from
            any device!
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Your data syncs across all devices using the same User ID</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
