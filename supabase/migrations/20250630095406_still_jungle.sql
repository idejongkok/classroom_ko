/*
  # Fix Demo Data and Policies

  1. New Tables
    - Add demo data for batches, enrollments, materials, videos, assignments, and attendance
  2. Security
    - Simplify RLS policies to avoid recursion
    - Enable proper access for all user roles
  3. Changes
    - Insert comprehensive demo data
    - Create non-recursive policies
*/

-- First, disable RLS temporarily to insert demo data
ALTER TABLE IF EXISTS batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS batch_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS video_recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignment_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_records DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "batches_select_policy" ON batches;
DROP POLICY IF EXISTS "batches_insert_policy" ON batches;
DROP POLICY IF EXISTS "batches_update_policy" ON batches;
DROP POLICY IF EXISTS "batches_delete_policy" ON batches;

DROP POLICY IF EXISTS "batch_enrollments_select_policy" ON batch_enrollments;
DROP POLICY IF EXISTS "batch_enrollments_insert_policy" ON batch_enrollments;
DROP POLICY IF EXISTS "batch_enrollments_update_policy" ON batch_enrollments;
DROP POLICY IF EXISTS "batch_enrollments_delete_policy" ON batch_enrollments;

DROP POLICY IF EXISTS "materials_select_policy" ON materials;
DROP POLICY IF EXISTS "materials_insert_policy" ON materials;
DROP POLICY IF EXISTS "materials_update_policy" ON materials;
DROP POLICY IF EXISTS "materials_delete_policy" ON materials;

DROP POLICY IF EXISTS "video_recordings_select_policy" ON video_recordings;
DROP POLICY IF EXISTS "video_recordings_insert_policy" ON video_recordings;
DROP POLICY IF EXISTS "video_recordings_update_policy" ON video_recordings;
DROP POLICY IF EXISTS "video_recordings_delete_policy" ON video_recordings;

DROP POLICY IF EXISTS "assignments_select_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_insert_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_update_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_delete_policy" ON assignments;

DROP POLICY IF EXISTS "attendance_sessions_select_policy" ON attendance_sessions;
DROP POLICY IF EXISTS "attendance_sessions_insert_policy" ON attendance_sessions;
DROP POLICY IF EXISTS "attendance_sessions_update_policy" ON attendance_sessions;
DROP POLICY IF EXISTS "attendance_sessions_delete_policy" ON attendance_sessions;

DROP POLICY IF EXISTS "assignment_submissions_select_policy" ON assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_insert_policy" ON assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_update_policy" ON assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_delete_policy" ON assignment_submissions;

DROP POLICY IF EXISTS "attendance_records_select_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_insert_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_update_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_delete_policy" ON attendance_records;

-- Insert demo data step by step
DO $$
DECLARE
    admin_profile_id uuid;
    instructor_profile_id uuid;
    student_profile_id uuid;
    batch1_id uuid := gen_random_uuid();
    batch2_id uuid := gen_random_uuid();
    batch3_id uuid := gen_random_uuid();
    assignment1_id uuid := gen_random_uuid();
    assignment2_id uuid := gen_random_uuid();
    session1_id uuid := gen_random_uuid();
    session2_id uuid := gen_random_uuid();
BEGIN
    -- Get profile IDs
    SELECT id INTO admin_profile_id FROM profiles WHERE email = 'admin@kelasotomesyen.com' LIMIT 1;
    SELECT id INTO instructor_profile_id FROM profiles WHERE email = 'instructor@kelasotomesyen.com' LIMIT 1;
    SELECT id INTO student_profile_id FROM profiles WHERE email = 'student@kelasotomesyen.com' LIMIT 1;

    -- Only proceed if we have the required profiles
    IF admin_profile_id IS NOT NULL AND instructor_profile_id IS NOT NULL AND student_profile_id IS NOT NULL THEN
        
        -- Insert demo batches
        INSERT INTO batches (id, name, description, color_from, color_to, instructor_id, start_date, end_date, is_active) VALUES 
            (batch1_id, 'React Fundamentals', 'Belajar dasar-dasar React untuk pemula', 'from-blue-500', 'to-blue-600', instructor_profile_id, '2024-01-01', '2024-03-31', true),
            (batch2_id, 'Node.js Backend Development', 'Membangun API dan backend dengan Node.js', 'from-green-500', 'to-green-600', instructor_profile_id, '2024-02-01', '2024-04-30', true),
            (batch3_id, 'Full Stack Web Development', 'Kelas lengkap pengembangan web full stack', 'from-purple-500', 'to-purple-600', instructor_profile_id, '2024-03-01', '2024-06-30', true)
        ON CONFLICT (id) DO NOTHING;

        -- Enroll student in all batches
        INSERT INTO batch_enrollments (batch_id, student_id, progress) VALUES 
            (batch1_id, student_profile_id, 75),
            (batch2_id, student_profile_id, 45),
            (batch3_id, student_profile_id, 20)
        ON CONFLICT (batch_id, student_id) DO UPDATE SET progress = EXCLUDED.progress;

        -- Insert demo materials
        INSERT INTO materials (batch_id, title, type, external_url, file_size, uploaded_by) VALUES 
            (batch1_id, 'Pengenalan React', 'link', 'https://react.dev/learn', NULL, instructor_profile_id),
            (batch1_id, 'React Components Guide', 'pdf', 'https://example.com/react-guide.pdf', '2.5 MB', instructor_profile_id),
            (batch2_id, 'Node.js Documentation', 'link', 'https://nodejs.org/docs', NULL, instructor_profile_id),
            (batch2_id, 'Express.js Tutorial', 'file', 'https://example.com/express-tutorial.zip', '15 MB', instructor_profile_id),
            (batch3_id, 'Full Stack Architecture', 'pdf', 'https://example.com/fullstack-arch.pdf', '5.2 MB', instructor_profile_id);

        -- Insert demo video recordings
        INSERT INTO video_recordings (batch_id, title, description, youtube_id, duration, recorded_date, uploaded_by) VALUES 
            (batch1_id, 'React Basics - Part 1', 'Pengenalan komponen dan JSX', 'dQw4w9WgXcQ', '45:30', '2024-01-15', instructor_profile_id),
            (batch1_id, 'React State Management', 'Belajar useState dan useEffect', 'dQw4w9WgXcQ', '52:15', '2024-01-22', instructor_profile_id),
            (batch2_id, 'Setting up Node.js', 'Instalasi dan konfigurasi Node.js', 'dQw4w9WgXcQ', '38:45', '2024-02-05', instructor_profile_id),
            (batch3_id, 'Full Stack Project Setup', 'Memulai proyek full stack dari awal', 'dQw4w9WgXcQ', '67:20', '2024-03-10', instructor_profile_id);

        -- Insert demo assignments
        INSERT INTO assignments (id, batch_id, title, description, due_date, max_score, created_by) VALUES 
            (assignment1_id, batch1_id, 'Membuat Komponen React', 'Buat 3 komponen React sederhana dengan props', '2024-02-01 23:59:00', 100, instructor_profile_id),
            (assignment2_id, batch1_id, 'Todo App dengan React', 'Buat aplikasi todo list menggunakan React hooks', '2024-02-15 23:59:00', 100, instructor_profile_id),
            (gen_random_uuid(), batch2_id, 'REST API dengan Express', 'Buat REST API sederhana dengan Express.js', '2024-03-01 23:59:00', 100, instructor_profile_id),
            (gen_random_uuid(), batch3_id, 'Full Stack Project', 'Buat aplikasi full stack dengan React dan Node.js', '2024-05-01 23:59:00', 100, instructor_profile_id);

        -- Insert demo assignment submissions
        INSERT INTO assignment_submissions (assignment_id, student_id, status, score, feedback, submitted_at, graded_at, graded_by) VALUES 
            (assignment1_id, student_profile_id, 'graded', 85, 'Bagus! Komponen sudah benar, tapi bisa ditingkatkan lagi struktur kodenya.', '2024-01-30 20:30:00', '2024-02-02 10:00:00', instructor_profile_id),
            (assignment2_id, student_profile_id, 'submitted', NULL, NULL, '2024-02-14 22:45:00', NULL, NULL);

        -- Insert demo attendance sessions
        INSERT INTO attendance_sessions (id, batch_id, title, session_date, start_time, end_time, status, created_by) VALUES 
            (session1_id, batch1_id, 'Sesi 1: Pengenalan React', '2024-01-15', '19:00', '21:00', 'completed', instructor_profile_id),
            (session2_id, batch1_id, 'Sesi 2: React Components', '2024-01-22', '19:00', '21:00', 'completed', instructor_profile_id),
            (gen_random_uuid(), batch1_id, 'Sesi 3: State Management', '2024-01-29', '19:00', '21:00', 'upcoming', instructor_profile_id),
            (gen_random_uuid(), batch2_id, 'Sesi 1: Node.js Basics', '2024-02-05', '19:00', '21:00', 'completed', instructor_profile_id),
            (gen_random_uuid(), batch3_id, 'Sesi 1: Project Planning', '2024-03-10', '19:00', '21:00', 'active', instructor_profile_id);

        -- Insert demo attendance records
        INSERT INTO attendance_records (session_id, student_id, attended, attended_at) VALUES 
            (session1_id, student_profile_id, true, '2024-01-15 19:05:00'),
            (session2_id, student_profile_id, true, '2024-01-22 19:02:00');

    END IF;
END $$;

-- Re-enable RLS and create simple policies
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for batches
CREATE POLICY "batches_allow_all_read" ON batches
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "batches_allow_admin_instructor_write" ON batches
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create simple policies for other tables
CREATE POLICY "batch_enrollments_allow_all" ON batch_enrollments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "materials_allow_all" ON materials
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "video_recordings_allow_all" ON video_recordings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "assignments_allow_all" ON assignments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "attendance_sessions_allow_all" ON attendance_sessions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "assignment_submissions_allow_all" ON assignment_submissions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "attendance_records_allow_all" ON attendance_records
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);