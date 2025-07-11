/*
  # Simplify all RLS policies

  This migration simplifies all Row Level Security policies by setting all permissions to true.
  This makes the system more permissive and easier to work with during development.

  1. Security Changes
    - All tables will have simple policies that allow all operations
    - No complex role-based restrictions
    - All users can perform all operations on all tables

  2. Tables Affected
    - profiles
    - users  
    - user_sessions
    - batches
    - batch_enrollments
    - materials
    - video_recordings
    - assignments
    - assignment_submissions
    - attendance_sessions
    - attendance_records
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

DROP POLICY IF EXISTS "user_sessions_all_policy" ON user_sessions;

DROP POLICY IF EXISTS "batches_allow_all_read" ON batches;
DROP POLICY IF EXISTS "batches_allow_admin_instructor_write" ON batches;
DROP POLICY IF EXISTS "batches_select_policy" ON batches;
DROP POLICY IF EXISTS "batches_insert_policy" ON batches;
DROP POLICY IF EXISTS "batches_update_policy" ON batches;
DROP POLICY IF EXISTS "batches_delete_policy" ON batches;

DROP POLICY IF EXISTS "batch_enrollments_allow_all" ON batch_enrollments;
DROP POLICY IF EXISTS "batch_enrollments_select_policy" ON batch_enrollments;
DROP POLICY IF EXISTS "batch_enrollments_insert_policy" ON batch_enrollments;
DROP POLICY IF EXISTS "batch_enrollments_update_policy" ON batch_enrollments;
DROP POLICY IF EXISTS "batch_enrollments_delete_policy" ON batch_enrollments;

DROP POLICY IF EXISTS "materials_allow_all" ON materials;
DROP POLICY IF EXISTS "materials_select_policy" ON materials;
DROP POLICY IF EXISTS "materials_insert_policy" ON materials;
DROP POLICY IF EXISTS "materials_update_policy" ON materials;
DROP POLICY IF EXISTS "materials_delete_policy" ON materials;

DROP POLICY IF EXISTS "video_recordings_allow_all" ON video_recordings;
DROP POLICY IF EXISTS "video_recordings_select_policy" ON video_recordings;
DROP POLICY IF EXISTS "video_recordings_insert_policy" ON video_recordings;
DROP POLICY IF EXISTS "video_recordings_update_policy" ON video_recordings;
DROP POLICY IF EXISTS "video_recordings_delete_policy" ON video_recordings;

DROP POLICY IF EXISTS "assignments_allow_all" ON assignments;
DROP POLICY IF EXISTS "assignments_select_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_insert_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_update_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_delete_policy" ON assignments;

DROP POLICY IF EXISTS "assignment_submissions_allow_all" ON assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_select_policy" ON assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_insert_policy" ON assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_update_policy" ON assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_delete_policy" ON assignment_submissions;

DROP POLICY IF EXISTS "attendance_sessions_allow_all" ON attendance_sessions;
DROP POLICY IF EXISTS "attendance_sessions_select_policy" ON attendance_sessions;
DROP POLICY IF EXISTS "attendance_sessions_insert_policy" ON attendance_sessions;
DROP POLICY IF EXISTS "attendance_sessions_update_policy" ON attendance_sessions;
DROP POLICY IF EXISTS "attendance_sessions_delete_policy" ON attendance_sessions;

DROP POLICY IF EXISTS "attendance_records_allow_all" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_select_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_insert_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_update_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_delete_policy" ON attendance_records;

-- Drop helper functions that might cause issues
DROP FUNCTION IF EXISTS get_current_user_profile();
DROP FUNCTION IF EXISTS is_user_enrolled_in_batch(uuid, uuid);
DROP FUNCTION IF EXISTS is_user_instructor_of_batch(uuid, uuid);

-- Create simple policies for all tables - everything is allowed

-- PROFILES
CREATE POLICY "profiles_allow_all" ON profiles
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- USERS
CREATE POLICY "users_allow_all" ON users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- USER SESSIONS
CREATE POLICY "user_sessions_allow_all" ON user_sessions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- BATCHES
CREATE POLICY "batches_allow_all" ON batches
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- BATCH ENROLLMENTS
CREATE POLICY "batch_enrollments_allow_all" ON batch_enrollments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- MATERIALS
CREATE POLICY "materials_allow_all" ON materials
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- VIDEO RECORDINGS
CREATE POLICY "video_recordings_allow_all" ON video_recordings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ASSIGNMENTS
CREATE POLICY "assignments_allow_all" ON assignments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ASSIGNMENT SUBMISSIONS
CREATE POLICY "assignment_submissions_allow_all" ON assignment_submissions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ATTENDANCE SESSIONS
CREATE POLICY "attendance_sessions_allow_all" ON attendance_sessions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ATTENDANCE RECORDS
CREATE POLICY "attendance_records_allow_all" ON attendance_records
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Ensure all tables have RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;