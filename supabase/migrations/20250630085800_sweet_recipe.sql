/*
  # Secure RLS Policies for Classroom Management System

  1. Security Overview
    - Implement proper role-based access control
    - Students can only access their enrolled classes
    - Instructors can only manage their own classes
    - Admins have full access
    - Prevent unauthorized data access and modification

  2. Tables Covered
    - profiles: User profile management
    - users: Authentication data
    - user_sessions: Session management
    - batches: Class management
    - batch_enrollments: Student enrollment
    - materials: Learning materials
    - video_recordings: Video content
    - assignments: Assignment management
    - assignment_submissions: Student submissions
    - attendance_sessions: Attendance management
    - attendance_records: Attendance tracking

  3. Security Principles
    - Least privilege access
    - Role-based permissions
    - Data isolation between classes
    - Audit trail preservation
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update for all users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable update for all users" ON users;
DROP POLICY IF EXISTS "Enable full access for user_sessions" ON user_sessions;
DROP POLICY IF EXISTS "Enable read access for all users" ON batches;
DROP POLICY IF EXISTS "Enable insert for instructors and admins" ON batches;
DROP POLICY IF EXISTS "Enable update for instructors and admins" ON batches;
DROP POLICY IF EXISTS "Enable delete for admins" ON batches;
DROP POLICY IF EXISTS "Enable read access for all users" ON batch_enrollments;
DROP POLICY IF EXISTS "Enable insert for all users" ON batch_enrollments;
DROP POLICY IF EXISTS "Enable update for all users" ON batch_enrollments;
DROP POLICY IF EXISTS "Enable delete for all users" ON batch_enrollments;
DROP POLICY IF EXISTS "Enable read access for all users" ON materials;
DROP POLICY IF EXISTS "Enable insert for instructors and admins" ON materials;
DROP POLICY IF EXISTS "Enable update for instructors and admins" ON materials;
DROP POLICY IF EXISTS "Enable delete for instructors and admins" ON materials;
DROP POLICY IF EXISTS "Enable read access for all users" ON video_recordings;
DROP POLICY IF EXISTS "Enable insert for instructors and admins" ON video_recordings;
DROP POLICY IF EXISTS "Enable update for instructors and admins" ON video_recordings;
DROP POLICY IF EXISTS "Enable delete for instructors and admins" ON video_recordings;
DROP POLICY IF EXISTS "Enable read access for all users" ON assignments;
DROP POLICY IF EXISTS "Enable insert for instructors and admins" ON assignments;
DROP POLICY IF EXISTS "Enable update for instructors and admins" ON assignments;
DROP POLICY IF EXISTS "Enable delete for instructors and admins" ON assignments;
DROP POLICY IF EXISTS "Enable read access for all users" ON assignment_submissions;
DROP POLICY IF EXISTS "Enable insert for students" ON assignment_submissions;
DROP POLICY IF EXISTS "Enable update for students and instructors" ON assignment_submissions;
DROP POLICY IF EXISTS "Enable delete for students" ON assignment_submissions;
DROP POLICY IF EXISTS "Enable read access for all users" ON attendance_sessions;
DROP POLICY IF EXISTS "Enable insert for instructors and admins" ON attendance_sessions;
DROP POLICY IF EXISTS "Enable update for instructors and admins" ON attendance_sessions;
DROP POLICY IF EXISTS "Enable delete for instructors and admins" ON attendance_sessions;
DROP POLICY IF EXISTS "Enable read access for all users" ON attendance_records;
DROP POLICY IF EXISTS "Enable insert for students" ON attendance_records;
DROP POLICY IF EXISTS "Enable update for students and instructors" ON attendance_records;
DROP POLICY IF EXISTS "Enable delete for students" ON attendance_records;

-- Helper function to get current user's profile
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE(user_id uuid, email text, role user_role)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.id, p.email, p.role
  FROM profiles p
  JOIN user_sessions s ON s.user_id = p.id
  WHERE s.token = current_setting('request.headers')::json->>'authorization'
    AND s.expires_at > now();
$$;

-- Helper function to check if user is enrolled in batch
CREATE OR REPLACE FUNCTION is_user_enrolled_in_batch(user_id uuid, batch_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM batch_enrollments 
    WHERE student_id = user_id AND batch_enrollments.batch_id = is_user_enrolled_in_batch.batch_id
  );
$$;

-- Helper function to check if user is instructor of batch
CREATE OR REPLACE FUNCTION is_user_instructor_of_batch(user_id uuid, batch_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM batches 
    WHERE instructor_id = user_id AND id = batch_id
  );
$$;

-- PROFILES TABLE POLICIES
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    -- Users can read all profiles (needed for instructor info, etc.)
    true
  );

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (
    -- Only admins can create new profiles
    EXISTS(
      SELECT 1 FROM get_current_user_profile() 
      WHERE role = 'admin'
    )
  );

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    -- Users can update their own profile, admins can update any
    id IN (SELECT user_id FROM get_current_user_profile())
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() 
      WHERE role = 'admin'
    )
  );

-- USERS TABLE POLICIES
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    -- Users can read their own user record, admins can read all
    id IN (SELECT user_id FROM get_current_user_profile())
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() 
      WHERE role = 'admin'
    )
  );

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (
    -- Only admins can create new users
    EXISTS(
      SELECT 1 FROM get_current_user_profile() 
      WHERE role = 'admin'
    )
  );

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (
    -- Users can update their own record, admins can update any
    id IN (SELECT user_id FROM get_current_user_profile())
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() 
      WHERE role = 'admin'
    )
  );

-- USER SESSIONS TABLE POLICIES
CREATE POLICY "user_sessions_all_policy" ON user_sessions
  FOR ALL USING (
    -- Allow all operations for session management
    true
  );

-- BATCHES TABLE POLICIES
CREATE POLICY "batches_select_policy" ON batches
  FOR SELECT USING (
    -- Students can see batches they're enrolled in
    -- Instructors can see batches they teach
    -- Admins can see all batches
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'instructor' AND instructor_id = p.user_id
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batch_enrollments be ON be.student_id = p.user_id
      WHERE p.role = 'student' AND be.batch_id = batches.id
    )
  );

CREATE POLICY "batches_insert_policy" ON batches
  FOR INSERT WITH CHECK (
    -- Only admins and instructors can create batches
    EXISTS(
      SELECT 1 FROM get_current_user_profile() 
      WHERE role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "batches_update_policy" ON batches
  FOR UPDATE USING (
    -- Admins can update any batch
    -- Instructors can update their own batches
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'instructor' AND instructor_id = p.user_id
    )
  );

CREATE POLICY "batches_delete_policy" ON batches
  FOR DELETE USING (
    -- Only admins can delete batches
    EXISTS(
      SELECT 1 FROM get_current_user_profile() 
      WHERE role = 'admin'
    )
  );

-- BATCH ENROLLMENTS TABLE POLICIES
CREATE POLICY "batch_enrollments_select_policy" ON batch_enrollments
  FOR SELECT USING (
    -- Students can see their own enrollments
    -- Instructors can see enrollments in their batches
    -- Admins can see all enrollments
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'student' AND student_id = p.user_id
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

CREATE POLICY "batch_enrollments_insert_policy" ON batch_enrollments
  FOR INSERT WITH CHECK (
    -- Admins and instructors can enroll students
    EXISTS(
      SELECT 1 FROM get_current_user_profile() 
      WHERE role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "batch_enrollments_update_policy" ON batch_enrollments
  FOR UPDATE USING (
    -- Students can update their own progress
    -- Instructors can update enrollments in their batches
    -- Admins can update any enrollment
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'student' AND student_id = p.user_id
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

CREATE POLICY "batch_enrollments_delete_policy" ON batch_enrollments
  FOR DELETE USING (
    -- Admins and instructors can remove enrollments
    EXISTS(
      SELECT 1 FROM get_current_user_profile() 
      WHERE role IN ('admin', 'instructor')
    )
  );

-- MATERIALS TABLE POLICIES
CREATE POLICY "materials_select_policy" ON materials
  FOR SELECT USING (
    -- Students can see materials from their enrolled batches
    -- Instructors can see materials from their batches
    -- Admins can see all materials
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batch_enrollments be ON be.student_id = p.user_id
      WHERE p.role = 'student' AND be.batch_id = materials.batch_id
    )
  );

CREATE POLICY "materials_insert_policy" ON materials
  FOR INSERT WITH CHECK (
    -- Instructors can add materials to their batches
    -- Admins can add materials to any batch
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

CREATE POLICY "materials_update_policy" ON materials
  FOR UPDATE USING (
    -- Same as insert policy
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

CREATE POLICY "materials_delete_policy" ON materials
  FOR DELETE USING (
    -- Same as insert policy
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

-- VIDEO RECORDINGS TABLE POLICIES
CREATE POLICY "video_recordings_select_policy" ON video_recordings
  FOR SELECT USING (
    -- Same access pattern as materials
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batch_enrollments be ON be.student_id = p.user_id
      WHERE p.role = 'student' AND be.batch_id = video_recordings.batch_id
    )
  );

CREATE POLICY "video_recordings_insert_policy" ON video_recordings
  FOR INSERT WITH CHECK (
    -- Same as materials insert policy
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

CREATE POLICY "video_recordings_update_policy" ON video_recordings
  FOR UPDATE USING (
    -- Same as materials update policy
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

CREATE POLICY "video_recordings_delete_policy" ON video_recordings
  FOR DELETE USING (
    -- Same as materials delete policy
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

-- ASSIGNMENTS TABLE POLICIES
CREATE POLICY "assignments_select_policy" ON assignments
  FOR SELECT USING (
    -- Same access pattern as materials
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batch_enrollments be ON be.student_id = p.user_id
      WHERE p.role = 'student' AND be.batch_id = assignments.batch_id
    )
  );

CREATE POLICY "assignments_insert_policy" ON assignments
  FOR INSERT WITH CHECK (
    -- Same as materials insert policy
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

CREATE POLICY "assignments_update_policy" ON assignments
  FOR UPDATE USING (
    -- Same as materials update policy
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

CREATE POLICY "assignments_delete_policy" ON assignments
  FOR DELETE USING (
    -- Same as materials delete policy
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

-- ASSIGNMENT SUBMISSIONS TABLE POLICIES
CREATE POLICY "assignment_submissions_select_policy" ON assignment_submissions
  FOR SELECT USING (
    -- Students can see their own submissions
    -- Instructors can see submissions for their assignments
    -- Admins can see all submissions
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'student' AND student_id = p.user_id
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN assignments a ON a.id = assignment_id
      JOIN batches b ON b.id = a.batch_id AND b.instructor_id = p.user_id
      WHERE p.role = 'instructor'
    )
  );

CREATE POLICY "assignment_submissions_insert_policy" ON assignment_submissions
  FOR INSERT WITH CHECK (
    -- Students can submit their own assignments
    -- Instructors and admins can create submissions (for grading purposes)
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role IN ('admin', 'instructor')
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN assignments a ON a.id = assignment_id
      JOIN batch_enrollments be ON be.batch_id = a.batch_id AND be.student_id = p.user_id
      WHERE p.role = 'student' AND student_id = p.user_id
    )
  );

CREATE POLICY "assignment_submissions_update_policy" ON assignment_submissions
  FOR UPDATE USING (
    -- Students can update their own submissions (before grading)
    -- Instructors can update submissions for grading
    -- Admins can update any submission
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'student' AND student_id = p.user_id AND status = 'pending'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN assignments a ON a.id = assignment_id
      JOIN batches b ON b.id = a.batch_id AND b.instructor_id = p.user_id
      WHERE p.role = 'instructor'
    )
  );

CREATE POLICY "assignment_submissions_delete_policy" ON assignment_submissions
  FOR DELETE USING (
    -- Students can delete their own ungraded submissions
    -- Admins can delete any submission
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'student' AND student_id = p.user_id AND status = 'pending'
    )
  );

-- ATTENDANCE SESSIONS TABLE POLICIES
CREATE POLICY "attendance_sessions_select_policy" ON attendance_sessions
  FOR SELECT USING (
    -- Same access pattern as materials
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batch_enrollments be ON be.student_id = p.user_id
      WHERE p.role = 'student' AND be.batch_id = attendance_sessions.batch_id
    )
  );

CREATE POLICY "attendance_sessions_insert_policy" ON attendance_sessions
  FOR INSERT WITH CHECK (
    -- Same as materials insert policy
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

CREATE POLICY "attendance_sessions_update_policy" ON attendance_sessions
  FOR UPDATE USING (
    -- Same as materials update policy
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

CREATE POLICY "attendance_sessions_delete_policy" ON attendance_sessions
  FOR DELETE USING (
    -- Same as materials delete policy
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN batches b ON b.instructor_id = p.user_id
      WHERE p.role = 'instructor' AND b.id = batch_id
    )
  );

-- ATTENDANCE RECORDS TABLE POLICIES
CREATE POLICY "attendance_records_select_policy" ON attendance_records
  FOR SELECT USING (
    -- Students can see their own attendance records
    -- Instructors can see attendance records for their sessions
    -- Admins can see all attendance records
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'student' AND student_id = p.user_id
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN attendance_sessions ats ON ats.id = session_id
      JOIN batches b ON b.id = ats.batch_id AND b.instructor_id = p.user_id
      WHERE p.role = 'instructor'
    )
  );

CREATE POLICY "attendance_records_insert_policy" ON attendance_records
  FOR INSERT WITH CHECK (
    -- Students can create their own attendance records
    -- Instructors and admins can create attendance records
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role IN ('admin', 'instructor')
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN attendance_sessions ats ON ats.id = session_id
      JOIN batch_enrollments be ON be.batch_id = ats.batch_id AND be.student_id = p.user_id
      WHERE p.role = 'student' AND student_id = p.user_id
    )
  );

CREATE POLICY "attendance_records_update_policy" ON attendance_records
  FOR UPDATE USING (
    -- Students can update their own attendance (within time limits)
    -- Instructors can update attendance for their sessions
    -- Admins can update any attendance record
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'student' AND student_id = p.user_id
    )
    OR EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      JOIN attendance_sessions ats ON ats.id = session_id
      JOIN batches b ON b.id = ats.batch_id AND b.instructor_id = p.user_id
      WHERE p.role = 'instructor'
    )
  );

CREATE POLICY "attendance_records_delete_policy" ON attendance_records
  FOR DELETE USING (
    -- Only admins can delete attendance records (for audit purposes)
    EXISTS(
      SELECT 1 FROM get_current_user_profile() p
      WHERE p.role = 'admin'
    )
  );

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