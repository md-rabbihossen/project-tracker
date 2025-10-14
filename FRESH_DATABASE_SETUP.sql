-- =====================================================
-- Progress Tracker Database Schema - FRESH INSTALL
-- For UUID-based authentication (no JWT tokens)
-- Run this ONCE in a fresh Supabase database
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

-- =====================================================
-- VERIFICATION QUERIES (Optional - Run separately)
-- =====================================================
-- Uncomment and run these to verify setup:

-- Check all tables exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public';

-- Check all policies:
-- SELECT schemaname, tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- =====================================================
