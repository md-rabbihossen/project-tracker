# 🧪 TEST SYNC NOW - Quick Guide

## 🚀 Quick Test (2 minutes):

### Step 1: Check Console

Open DevTools (F12) → Console tab

### Step 2: Add a Task

1. Click **"Home"** section
2. Click **"+ Add Task"** button
3. Enter: "Test sync to Supabase"
4. Click **Save**

### Step 3: Watch Console

You should see:

```
💾 Data auto-saved to localStorage
☁️ All data synced to cloud successfully
```

### Step 4: Verify in Supabase

1. Go to **Supabase Dashboard**
2. Click **Table Editor** → **today_tasks**
3. Find your row (with your `user_id`)
4. Click to expand the `tasks` JSONB column
5. **Your task is there!** 🎉

---

## 📊 What to Check in Each Table:

### **users** table:

- Should have 1 row with your User ID
- `user_name` column shows your name
- `created_at` and `updated_at` timestamps

### **today_tasks** table:

- `tasks` column (JSONB array)
- Click to expand → See all your tasks
- `completed_one_time_tasks` column
- `last_reset_date` column

### **roadmap** table:

- `roadmap_data` column (JSONB object)
- Contains your weekly learning plan
- Updates when you modify roadmap

### **books** table:

- `books_data` column (JSONB array)
- Your reading list with progress

---

## 🔍 Console Commands to Test:

Open Console (F12) and run:

```javascript
// Check current User ID
console.log("User ID:", localStorage.getItem("userId"));

// Check what's in localStorage
console.log("Roadmap:", JSON.parse(localStorage.getItem("roadmap")));
console.log("Tasks:", JSON.parse(localStorage.getItem("todayTasks")));
console.log("Books:", JSON.parse(localStorage.getItem("books")));

// Force a manual sync (if needed)
window.location.reload();
```

---

## 🎯 Expected Behavior:

### ✅ Success Looks Like:

- Green sync indicator in profile menu
- Console shows: "☁️ All data synced to cloud successfully"
- Data appears in Supabase tables
- No error messages
- Changes appear within 1-2 seconds

### ❌ Failure Looks Like:

- Red sync indicator
- Console shows: "Failed to save/sync data"
- 401 or 400 errors
- Data not in Supabase

---

## 🆘 If Sync Fails:

### Check 1: User ID exists

```javascript
console.log(localStorage.getItem("userId"));
// Should output: "your-uuid-here"
// If null → Logout and login again
```

### Check 2: Supabase credentials

Open `src/services/supabase.js`:

```javascript
const supabaseUrl = "https://vndlnqetnjelddfanmqq.supabase.co";
const supabaseKey = "eyJhbGc..."; // Should be your actual key
```

### Check 3: Internet connection

- Open DevTools → Network tab
- Look for requests to `supabase.co`
- Should be status 200 or 201 (success)
- If status 401 → RLS policy issue
- If status 400 → Column mismatch

### Check 4: RLS Policies

Run in Supabase SQL Editor:

```sql
-- Check if policies exist
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public';

-- Should see:
-- "Allow anyone to create user"
-- "Allow all roadmap operations"
-- "Allow all today_tasks operations"
-- etc.
```

---

## 🎉 Multi-Device Test:

### Device 1:

1. Login with your User ID
2. Add a task: "From Device 1"
3. Wait 2 seconds

### Device 2 (another browser):

1. Login with **SAME User ID**
2. Wait 3-5 seconds
3. You should see: "From Device 1" task appear!
4. Add a task: "From Device 2"

### Device 1:

1. Wait 3-5 seconds
2. You should see: "From Device 2" task appear!

**If this works → Real-time sync is working perfectly!** 🎉

---

## 📝 What to Report:

If sync doesn't work, send me:

1. **Console output** (screenshot)
2. **Supabase Table Editor** (screenshot of `today_tasks` table)
3. **Network tab** (screenshot of supabase.co requests)
4. **User ID** (from localStorage)

---

## ✅ Quick Verification Checklist:

- [ ] User logged in (see User ID in profile menu)
- [ ] Console shows sync messages
- [ ] No error messages in console
- [ ] Data appears in Supabase Table Editor
- [ ] Green sync indicator visible
- [ ] Multi-device sync works (if tested)
- [ ] Offline changes sync when back online

---

**Test it now and let me know!** 🚀
