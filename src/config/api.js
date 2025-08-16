// No API configuration needed - we're using Firebase directly!
// Firebase handles authentication and database just like Supabase did
// Updated: Force rebuild for Firebase integration

const API_CONFIG = {
  // Firebase configuration is in firebase.js
  message:
    "Using Firebase for authentication and database - no backend server needed!",
  version: "2.0-firebase", // Force cache bust
};

export default API_CONFIG;
