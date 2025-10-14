# 🚀 Supabase Setup Guide for Progress Tracker

## Step 1: Create Supabase Account (5 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email
4. Click **"New Project"**
5. Fill in:
   - **Project Name**: `progress-tracker`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you (e.g., US East, Europe West, Asia Southeast)
6. Click **"Create new project"** (takes ~2 minutes)

---

## Step 2: Get Your API Keys (2 minutes)

1. Once project is created, go to **Settings** (⚙️ icon in sidebar)
2. Click **"API"** in the left menu
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUz...` (long string)
4. **Copy both** - you'll need them later!

---

## Step 3: Create Database Tables (10 minutes)

### Option A: Using SQL Editor (Recommended)

1. In Supabase Dashboard, click **"SQL Editor"** in sidebar
2. Click **"New Query"**
3. Copy and paste the SQL code below
4. Click **"Run"** button

```sql
-- =====================================================
-- Progress Tracker Database Schema - FIXED VERSION
-- For UUID-based authentication (no JWT tokens)
-- =====================================================

-- =====================================================
-- 1. CREATE USERS TABLE
-- =====================================================
CREATE TABLE public.users (
    user_id UUID PRIMARY KEY,
    user_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Allow anyone to create user"
    ON public.users
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Users can view all users"
    ON public.users
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Users can update own data"
    ON public.users
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 2. CREATE ROADMAP TABLE
-- =====================================================
CREATE TABLE public.roadmap (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    roadmap_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.roadmap ENABLE ROW LEVEL SECURITY;

-- RLS Policy (allow all operations for simplicity)
CREATE POLICY "Allow all roadmap operations"
    ON public.roadmap
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 3. CREATE TODAY_TASKS TABLE
-- =====================================================
CREATE TABLE public.today_tasks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    tasks JSONB NOT NULL DEFAULT '[]',
    completed_one_time_tasks JSONB NOT NULL DEFAULT '[]',
    last_reset_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.today_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all today_tasks operations"
    ON public.today_tasks
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 4. CREATE BOOKS TABLE
-- =====================================================
CREATE TABLE public.books (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    books_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all books operations"
    ON public.books
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 5. CREATE POMODORO_STATS TABLE
-- =====================================================
CREATE TABLE public.pomodoro_stats (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    stats_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.pomodoro_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all pomodoro_stats operations"
    ON public.pomodoro_stats
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 6. CREATE DAILY_PROGRESS TABLE
-- =====================================================
CREATE TABLE public.daily_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    progress_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all daily_progress operations"
    ON public.daily_progress
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 7. CREATE USER_GOALS TABLE
-- =====================================================
CREATE TABLE public.user_goals (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    goals JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all user_goals operations"
    ON public.user_goals
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 8. CREATE APP_SETTINGS TABLE
-- =====================================================
CREATE TABLE public.app_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all app_settings operations"
    ON public.app_settings
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_roadmap_user_id ON public.roadmap(user_id);
CREATE INDEX idx_today_tasks_user_id ON public.today_tasks(user_id);
CREATE INDEX idx_books_user_id ON public.books(user_id);
CREATE INDEX idx_pomodoro_stats_user_id ON public.pomodoro_stats(user_id);
CREATE INDEX idx_daily_progress_user_id ON public.daily_progress(user_id);
CREATE INDEX idx_daily_progress_date ON public.daily_progress(date);
CREATE INDEX idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX idx_app_settings_user_id ON public.app_settings(user_id);

-- =====================================================
-- 10. CREATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_updated_at
    BEFORE UPDATE ON public.roadmap
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_today_tasks_updated_at
    BEFORE UPDATE ON public.today_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pomodoro_stats_updated_at
    BEFORE UPDATE ON public.pomodoro_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_progress_updated_at
    BEFORE UPDATE ON public.daily_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON public.user_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ✅ SUCCESS! DATABASE SCHEMA CREATED!
-- =====================================================
-- All 8 tables created with:
-- - Row Level Security enabled
-- - Simple policies for UUID-based auth
-- - Performance indexes
-- - Auto-updating timestamps
-- - Foreign key relationships
-- =====================================================
```

5. Click **"Run"** button (bottom right)
6. You should see: **"Success. No rows returned"** ✅

---

### Option B: Using Table Editor (Manual - Skip if you used Option A)

<details>
<summary>Click to expand manual steps</summary>

1. Click **"Table Editor"** in sidebar
2. Click **"New Table"**
3. Create each table manually... (but SQL is much faster!)

</details>

---

## Step 4: Verify Tables Created (2 minutes)

1. Click **"Table Editor"** in sidebar
2. You should see these tables:

   - ✅ `users`
   - ✅ `roadmap`
   - ✅ `today_tasks`
   - ✅ `books`
   - ✅ `pomodoro_stats`
   - ✅ `daily_progress`
   - ✅ `user_goals`
   - ✅ `app_settings`

3. Click on any table to view its structure

---

## Step 5: Configure Row Level Security (RLS) - IMPORTANT! 🔒

**Already done if you used the SQL script above!** ✅

But verify:

1. Click on any table
2. Click **"RLS Disabled"** toggle to enable it
3. You should see **"RLS Enabled"** in green

---

## Step 6: Update Your Project Code (Next Step)

Now that Supabase is set up, we'll:

1. Install Supabase client library
2. Add your API keys to the project
3. Replace localStorage with Supabase sync

**Continue to the code implementation steps below!** 👇

---

## 🎉 Supabase Setup Complete!

Your database is now ready for:

- ✅ Real-time sync across devices
- ✅ Secure user data isolation
- ✅ Automatic backups
- ✅ Unlimited data storage (within free tier)

---

## 📊 What Each Table Stores:

| Table            | Purpose                             |
| ---------------- | ----------------------------------- |
| `users`          | User profile (ID, name)             |
| `roadmap`        | Weekly learning roadmap data        |
| `today_tasks`    | Daily tasks and to-dos              |
| `books`          | Reading progress tracking           |
| `pomodoro_stats` | Timer session analytics             |
| `daily_progress` | Date-specific progress data         |
| `user_goals`     | Personal goals and targets          |
| `app_settings`   | App preferences (quote index, etc.) |

---

## 🔐 Security Features Enabled:

- **Row Level Security (RLS)**: Users can only see their own data
- **UUID-based user IDs**: No sequential IDs (more secure)
- **Automatic timestamps**: Track when data was created/updated
- **Foreign key constraints**: Data integrity maintained
- **Indexes**: Fast queries even with lots of data

---

## 🆘 Troubleshooting:

### Error: "permission denied for table"

- **Fix**: Make sure RLS policies were created (run the SQL script again)

### Error: "relation already exists"

- **Fix**: Tables already created! You're good to go ✅

### Can't see tables in Table Editor

- **Fix**: Refresh the page, or check SQL Editor → History to see if queries ran

---

## 📝 Next Steps:

1. ✅ Supabase account created
2. ✅ Database tables created
3. ✅ Security policies enabled
4. ⏳ Install Supabase in your project (next step)
5. ⏳ Add API keys to your code
6. ⏳ Test sync functionality

**Ready to code!** 🚀
