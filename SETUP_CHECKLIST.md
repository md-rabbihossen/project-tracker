# ✅ SETUP CHECKLIST - Follow This Step by Step

Print this page or follow along on your screen!

---

## Phase 1: Preparation (5 minutes)

### [ ] Step 1.1: Open Terminal

```powershell
# Navigate to project folder
cd c:\Users\Rahat\Videos\Progress-Tracker-02-main
```

### [ ] Step 1.2: Install Dependencies

```powershell
npm install
```

**Expected result**: `added X packages` message

**If error**: Delete `node_modules` folder and `package-lock.json`, then try again

---

## Phase 2: Supabase Account Setup (10 minutes)

### [ ] Step 2.1: Create Account

- Go to: https://supabase.com
- Click: **"Start your project"**
- Sign up with: GitHub (recommended) or Email

### [ ] Step 2.2: Create Project

- Click: **"New Project"**
- **Project Name**: `progress-tracker`
- **Database Password**: Create & SAVE IT!
- **Region**: Choose closest to you
- Click: **"Create new project"**
- Wait: ~2 minutes for setup

### [ ] Step 2.3: Verify Project Ready

- You should see your dashboard
- Left sidebar shows: Table Editor, SQL Editor, etc.
- Top shows: Project URL

---

## Phase 3: Database Setup (5 minutes)

### [ ] Step 3.1: Open SQL Editor

- Click: **"SQL Editor"** in left sidebar
- Click: **"New Query"** button

### [ ] Step 3.2: Copy SQL Script

- Open file: `SUPABASE_SETUP_GUIDE.md` (in this project)
- Scroll to SQL script (starts at line ~25)
- Select ALL SQL code (Ctrl+A in the code block)
- Copy (Ctrl+C)

### [ ] Step 3.3: Run SQL Script

- Paste into Supabase SQL Editor (Ctrl+V)
- Click: **"Run"** button (bottom right)
- Wait: 5-10 seconds
- Expected result: ✅ **"Success. No rows returned"**

**If error**: Check that you selected the ENTIRE SQL script including the first and last lines

### [ ] Step 3.4: Verify Tables Created

- Click: **"Table Editor"** in left sidebar
- You should see 8 tables:
  - [ ] users
  - [ ] roadmap
  - [ ] today_tasks
  - [ ] books
  - [ ] pomodoro_stats
  - [ ] daily_progress
  - [ ] user_goals
  - [ ] app_settings

**If missing tables**: Go back to SQL Editor and re-run the script

---

## Phase 4: Get API Credentials (2 minutes)

### [ ] Step 4.1: Open API Settings

- Click: **"Settings"** (⚙️ icon in left sidebar)
- Click: **"API"** in the submenu

### [ ] Step 4.2: Copy Project URL

- Find: **Project URL**
- Example: `https://abcdefgh.supabase.co`
- Click: Copy button OR select and copy (Ctrl+C)
- Paste somewhere temporarily (Notepad, etc.)

### [ ] Step 4.3: Copy API Key

- Find: **Project API keys** section
- Look for: **`anon` `public`** key
- This is a LONG string starting with `eyJhbG...`
- Click: Copy button
- Paste somewhere temporarily (below the URL)

**Important**: Make sure you copied the COMPLETE key (it's very long!)

---

## Phase 5: Add Credentials to Project (2 minutes)

### [ ] Step 5.1: Open Supabase Service File

- Open VS Code or your text editor
- Open file: `src/services/supabase.js`
- Find lines 4-5

### [ ] Step 5.2: Replace Placeholders

**Current code (lines 4-5):**

```javascript
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_ANON_KEY";
```

**Replace with YOUR actual values:**

```javascript
const supabaseUrl = "https://abcdefgh.supabase.co"; // Paste YOUR URL
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5..."; // Paste YOUR key
```

### [ ] Step 5.3: Save File

- Save (Ctrl+S)
- Close the file

**Double-check**:

- [ ] URL is in quotes
- [ ] Key is in quotes
- [ ] No spaces around equals signs
- [ ] Semicolons at end of lines

---

## Phase 6: Test the Application (5 minutes)

### [ ] Step 6.1: Start Development Server

```powershell
npm run dev
```

**Expected output**:

```
VITE v6.3.5  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### [ ] Step 6.2: Open Browser

- Open: http://localhost:5173
- You should see: **Login Page** (not the old app!)

**If you see the old app**: Clear browser cache (Ctrl+Shift+Delete) and refresh

### [ ] Step 6.3: Check Console for Errors

- Press F12 to open DevTools
- Click: **Console** tab
- Look for: Any RED error messages

**If you see errors about Supabase**:

- [ ] Check credentials in `supabase.js`
- [ ] Make sure you saved the file
- [ ] Refresh page (F5)

---

## Phase 7: First Login (3 minutes)

### [ ] Step 7.1: Enter Your Name

- Type your name in the "Your Name" field
- Example: "Rahat"

### [ ] Step 7.2: Generate User ID

- Click: **"🎉 Generate New User ID"** button
- Wait: 1-2 seconds
- You should be logged in and see the main app!

### [ ] Step 7.3: Copy Your User ID

- Click: **Profile icon** (top right)
- You'll see your User ID (starts with letters/numbers)
- Click: **"Copy"** button next to User ID

### [ ] Step 7.4: SAVE YOUR USER ID

**CRITICAL**: Save this ID somewhere safe!

- [ ] Paste into a Notes app
- [ ] OR paste into a password manager
- [ ] OR write it down on paper
- [ ] OR email it to yourself

**Without this ID, you can't access your data from other devices!**

---

## Phase 8: Verify Sync Working (3 minutes)

### [ ] Step 8.1: Add a Test Task

- Go to: **Today's Tasks** section
- Add a task: "Test sync"
- Press Enter

### [ ] Step 8.2: Check Console Logs

- Press F12 → Console tab
- Look for messages like:
  - ✅ `"Data synced to cloud"`
  - ✅ `"Today tasks synced to cloud"`

**If you see these ✅ messages**: Sync is working!

### [ ] Step 8.3: Check Supabase Dashboard

- Go back to Supabase dashboard
- Click: **"Table Editor"**
- Click: **"today_tasks"** table
- You should see your data!

---

## Phase 9: Test Multi-Device (Optional, 10 minutes)

### [ ] Step 9.1: Open on Another Device

- Phone, tablet, or another computer
- Open: http://localhost:5173 (if same network)
  - OR deploy to Vercel/Netlify first

### [ ] Step 9.2: Login with Same ID

- Enter your name
- Paste your saved User ID
- Click: **"Continue with Existing ID"**

### [ ] Step 9.3: Verify Data Appears

- All your tasks should appear!
- Try adding a task on one device
- Watch it appear on the other device in real-time! ✨

---

## ✅ SUCCESS VERIFICATION

### You're all set if:

- [ ] App starts without errors
- [ ] Login page works
- [ ] Can generate or use User ID
- [ ] Can add tasks
- [ ] Console shows ✅ sync messages
- [ ] Data appears in Supabase dashboard
- [ ] (Optional) Works on multiple devices

---

## 🆘 TROUBLESHOOTING

### Problem: "Module not found" error

**Solution**:

```powershell
npm install
```

### Problem: "Failed to connect to Supabase"

**Solution**:

1. Check `src/services/supabase.js`
2. Verify URL and Key are correct
3. Make sure they're in quotes
4. Refresh browser

### Problem: "Permission denied for table"

**Solution**:

1. Go to Supabase SQL Editor
2. Re-run the SQL script
3. Refresh your app

### Problem: App shows old version (no login page)

**Solution**:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check that you modified `src/App.jsx`

### Problem: "User ID not working on other device"

**Solution**:

1. Make sure you copied the COMPLETE ID
2. Check for extra spaces
3. Try copying again from Profile menu

---

## 🎉 YOU'RE DONE!

### What you achieved:

✅ Professional cloud-synced app
✅ Real-time updates across devices
✅ Secure data storage
✅ Offline support
✅ No 30-day expiration issues

### Next steps:

1. Use the app daily
2. Test on multiple devices
3. Enjoy seamless sync!
4. Share your User ID with other devices

---

## 📞 QUICK REFERENCE

### Important Files:

- `src/services/supabase.js` - Add your credentials here
- `QUICK_START.md` - Quick reference guide
- `SUPABASE_SETUP_GUIDE.md` - Detailed SQL script

### Important URLs:

- App: http://localhost:5173
- Supabase Dashboard: https://supabase.com/dashboard

### Console Commands:

```powershell
# Install dependencies
npm install

# Start app
npm run dev

# Stop app
Ctrl+C
```

### Browser Shortcuts:

- Open DevTools: **F12**
- Refresh: **F5**
- Hard Refresh: **Ctrl+Shift+R**
- Clear Cache: **Ctrl+Shift+Delete**

---

**Print this checklist and follow step by step!** 📋✅
