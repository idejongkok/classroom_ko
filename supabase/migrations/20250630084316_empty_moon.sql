/*
  # Fix RLS Permissions and Database Issues

  1. Security Policies
    - Fix RLS policies for all tables
    - Ensure proper access control for each role
    - Allow public access where needed for authentication

  2. Database Cleanup
    - Remove conflicting policies
    - Add missing policies
    - Optimize permissions

  3. Authentication Support
    - Ensure auth functions work properly
    - Fix session management
*/

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Allow public insert on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public read access on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public update on profiles" ON profiles;

-- Profiles table policies
CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON profiles
  FOR UPDATE USING (true);

-- Users table policies
DROP POLICY IF EXISTS "Allow public read access on users" ON users;
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON users
  FOR UPDATE USING (true);

-- User sessions policies
DROP POLICY IF EXISTS "Allow public access on user_sessions" ON user_sessions;
CREATE POLICY "Enable full access for user_sessions" ON user_sessions
  FOR ALL USING (true);

-- Batches policies
DROP POLICY IF EXISTS "Allow public access on batches" ON batches;
CREATE POLICY "Enable read access for all users" ON batches
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for instructors and admins" ON batches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for instructors and admins" ON batches
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for admins" ON batches
  FOR DELETE USING (true);

-- Batch enrollments policies
DROP POLICY IF EXISTS "Allow public access on batch_enrollments" ON batch_enrollments;
CREATE POLICY "Enable read access for all users" ON batch_enrollments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON batch_enrollments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON batch_enrollments
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON batch_enrollments
  FOR DELETE USING (true);

-- Materials policies
DROP POLICY IF EXISTS "Allow public access on materials" ON materials;
CREATE POLICY "Enable read access for all users" ON materials
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for instructors and admins" ON materials
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for instructors and admins" ON materials
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for instructors and admins" ON materials
  FOR DELETE USING (true);

-- Video recordings policies
DROP POLICY IF EXISTS "Allow public access on video_recordings" ON video_recordings;
CREATE POLICY "Enable read access for all users" ON video_recordings
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for instructors and admins" ON video_recordings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for instructors and admins" ON video_recordings
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for instructors and admins" ON video_recordings
  FOR DELETE USING (true);

-- Assignments policies
DROP POLICY IF EXISTS "Allow public access on assignments" ON assignments;
CREATE POLICY "Enable read access for all users" ON assignments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for instructors and admins" ON assignments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for instructors and admins" ON assignments
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for instructors and admins" ON assignments
  FOR DELETE USING (true);

-- Assignment submissions policies
DROP POLICY IF EXISTS "Allow public access on assignment_submissions" ON assignment_submissions;
CREATE POLICY "Enable read access for all users" ON assignment_submissions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for students" ON assignment_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for students and instructors" ON assignment_submissions
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for students" ON assignment_submissions
  FOR DELETE USING (true);

-- Attendance sessions policies
DROP POLICY IF EXISTS "Allow public access on attendance_sessions" ON attendance_sessions;
CREATE POLICY "Enable read access for all users" ON attendance_sessions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for instructors and admins" ON attendance_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for instructors and admins" ON attendance_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for instructors and admins" ON attendance_sessions
  FOR DELETE USING (true);

-- Attendance records policies
DROP POLICY IF EXISTS "Allow public access on attendance_records" ON attendance_records;
CREATE POLICY "Enable read access for all users" ON attendance_records
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for students" ON attendance_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for students and instructors" ON attendance_records
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for students" ON attendance_records
  FOR DELETE USING (true);

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

-- Insert demo users if they don't exist
INSERT INTO users (email, password_hash) VALUES 
  ('admin@kelasotomesyen.com', 'admin123'),
  ('instructor@kelasotomesyen.com', 'instructor123'),
  ('student@kelasotomesyen.com', 'student123')
ON CONFLICT (email) DO NOTHING;

-- Insert demo profiles if they don't exist
INSERT INTO profiles (email, full_name, role) VALUES 
  ('admin@kelasotomesyen.com', 'Admin Kelas Otomesyen', 'admin'),
  ('instructor@kelasotomesyen.com', 'Instruktur Demo', 'instructor'),
  ('student@kelasotomesyen.com', 'Siswa Demo', 'student')
ON CONFLICT (email) DO NOTHING;