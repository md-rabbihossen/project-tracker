-- Migration: Add today_daily_tasks table for Track page progress tasks sync
-- This table stores the daily progress tasks (course hours, book pages, etc.)
-- that appear on the Track page

-- Create the table
CREATE TABLE IF NOT EXISTS today_daily_tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  daily_tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_today_daily_tasks_user_id ON today_daily_tasks(user_id);

-- Enable Row Level Security
ALTER TABLE today_daily_tasks ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own daily tasks" ON today_daily_tasks;
DROP POLICY IF EXISTS "Users can insert own daily tasks" ON today_daily_tasks;
DROP POLICY IF EXISTS "Users can update own daily tasks" ON today_daily_tasks;
DROP POLICY IF EXISTS "Users can delete own daily tasks" ON today_daily_tasks;

-- Create PERMISSIVE RLS policies (allow all authenticated operations)
-- This matches the pattern used by other tables in your app

-- Policy: Allow all SELECT operations (viewing data)
CREATE POLICY "Enable read access for all users" ON today_daily_tasks
  FOR SELECT
  USING (true);

-- Policy: Allow all INSERT operations (creating data)
CREATE POLICY "Enable insert access for all users" ON today_daily_tasks
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow all UPDATE operations (modifying data)
CREATE POLICY "Enable update access for all users" ON today_daily_tasks
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow all DELETE operations (removing data)
CREATE POLICY "Enable delete access for all users" ON today_daily_tasks
  FOR DELETE
  USING (true);

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_today_daily_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER today_daily_tasks_updated_at
  BEFORE UPDATE ON today_daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_today_daily_tasks_updated_at();

-- Add comment to the table
COMMENT ON TABLE today_daily_tasks IS 'Stores daily progress tasks for the Track page (course hours, book pages, etc.)';
COMMENT ON COLUMN today_daily_tasks.user_id IS 'User ID (matches the userId in localStorage)';
COMMENT ON COLUMN today_daily_tasks.daily_tasks IS 'Array of daily task objects with progress tracking';
