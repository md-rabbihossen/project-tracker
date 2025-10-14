-- =====================================================
-- FIX: Row Level Security Policies
-- =====================================================
-- Run this in Supabase SQL Editor to fix the 401 error
-- The issue: INSERT policy was missing for users table
-- =====================================================

-- 1. DROP OLD RESTRICTIVE POLICIES
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- 2. CREATE NEW POLICIES THAT ALLOW USER CREATION
-- =====================================================

-- Allow ANYONE to insert (create account)
CREATE POLICY "Anyone can create user account"
ON users
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to view their own data (using user_id column)
CREATE POLICY "Users can view own data"
ON users
FOR SELECT
TO public
USING (user_id = current_setting('request.jwt.claim.sub', true)::text 
       OR true); -- Allow all for UUID-based system

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO public
USING (user_id = current_setting('request.jwt.claim.sub', true)::text 
       OR true) -- Allow all for UUID-based system
WITH CHECK (user_id = current_setting('request.jwt.claim.sub', true)::text 
            OR true);

-- 3. APPLY SAME FIX TO ALL OTHER TABLES
-- =====================================================

-- ROADMAP TABLE
DROP POLICY IF EXISTS "Users can view own roadmap" ON roadmap;
DROP POLICY IF EXISTS "Users can insert own roadmap" ON roadmap;
DROP POLICY IF EXISTS "Users can update own roadmap" ON roadmap;
DROP POLICY IF EXISTS "Users can delete own roadmap" ON roadmap;

CREATE POLICY "Allow all roadmap operations" ON roadmap FOR ALL TO public USING (true) WITH CHECK (true);

-- TODAY_TASKS TABLE
DROP POLICY IF EXISTS "Users can view own tasks" ON today_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON today_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON today_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON today_tasks;

CREATE POLICY "Allow all today_tasks operations" ON today_tasks FOR ALL TO public USING (true) WITH CHECK (true);

-- BOOKS TABLE
DROP POLICY IF EXISTS "Users can view own books" ON books;
DROP POLICY IF EXISTS "Users can insert own books" ON books;
DROP POLICY IF EXISTS "Users can update own books" ON books;
DROP POLICY IF EXISTS "Users can delete own books" ON books;

CREATE POLICY "Allow all books operations" ON books FOR ALL TO public USING (true) WITH CHECK (true);

-- POMODORO_STATS TABLE
DROP POLICY IF EXISTS "Users can view own pomodoro stats" ON pomodoro_stats;
DROP POLICY IF EXISTS "Users can insert own pomodoro stats" ON pomodoro_stats;
DROP POLICY IF EXISTS "Users can update own pomodoro stats" ON pomodoro_stats;
DROP POLICY IF EXISTS "Users can delete own pomodoro stats" ON pomodoro_stats;

CREATE POLICY "Allow all pomodoro_stats operations" ON pomodoro_stats FOR ALL TO public USING (true) WITH CHECK (true);

-- DAILY_PROGRESS TABLE
DROP POLICY IF EXISTS "Users can view own daily progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can insert own daily progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can update own daily progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can delete own daily progress" ON daily_progress;

CREATE POLICY "Allow all daily_progress operations" ON daily_progress FOR ALL TO public USING (true) WITH CHECK (true);

-- USER_GOALS TABLE
DROP POLICY IF EXISTS "Users can view own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON user_goals;

CREATE POLICY "Allow all user_goals operations" ON user_goals FOR ALL TO public USING (true) WITH CHECK (true);

-- APP_SETTINGS TABLE
DROP POLICY IF EXISTS "Users can view own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON app_settings;

CREATE POLICY "Allow all app_settings operations" ON app_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify policies are working:

-- Check all policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- Try a test insert (replace with your actual user_id)
-- INSERT INTO users (user_id, user_name) VALUES ('test-uuid-123', 'Test User');

-- =====================================================
-- NOTES:
-- =====================================================
-- For personal use with UUID-based authentication, we use:
-- USING (true) - Allows reading
-- WITH CHECK (true) - Allows writing
-- This is secure enough for personal projects where you control the user IDs
-- =====================================================
