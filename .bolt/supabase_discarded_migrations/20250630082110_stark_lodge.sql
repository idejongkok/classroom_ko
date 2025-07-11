/*
  # Final Database Cleanup and Optimization

  1. Remove unused tables and functions
  2. Optimize indexes
  3. Clean up RLS policies
  4. Ensure data consistency
*/

-- Remove unused tables that might exist from previous migrations
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS testimonial_submissions CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;

-- Clean up any orphaned data
DELETE FROM batch_enrollments WHERE batch_id NOT IN (SELECT id FROM batches);
DELETE FROM materials WHERE batch_id NOT IN (SELECT id FROM batches);
DELETE FROM video_recordings WHERE batch_id NOT IN (SELECT id FROM batches);
DELETE FROM assignments WHERE batch_id NOT IN (SELECT id FROM batches);
DELETE FROM assignment_submissions WHERE assignment_id NOT IN (SELECT id FROM assignments);
DELETE FROM attendance_sessions WHERE batch_id NOT IN (SELECT id FROM batches);
DELETE FROM attendance_records WHERE session_id NOT IN (SELECT id FROM attendance_sessions);

-- Optimize indexes for better performance
DROP INDEX IF EXISTS idx_courses_slug;
DROP INDEX IF EXISTS courses_slug_key;
DROP INDEX IF EXISTS idx_email_verifications_expires_at;
DROP INDEX IF EXISTS idx_email_verifications_token;
DROP INDEX IF EXISTS email_verifications_token_key;

-- Create optimized indexes for actual tables
CREATE INDEX IF NOT EXISTS idx_batches_instructor_id ON batches(instructor_id);
CREATE INDEX IF NOT EXISTS idx_batches_active ON batches(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_student_id ON batch_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_batch_id ON batch_enrollments(batch_id);
CREATE INDEX IF NOT EXISTS idx_materials_batch_id ON materials(batch_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_batch_id ON video_recordings(batch_id);
CREATE INDEX IF NOT EXISTS idx_assignments_batch_id ON assignments(batch_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_batch_id ON attendance_sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);

-- Ensure all foreign key constraints are properly set
ALTER TABLE batches 
  DROP CONSTRAINT IF EXISTS batches_instructor_id_fkey,
  ADD CONSTRAINT batches_instructor_id_fkey 
    FOREIGN KEY (instructor_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE batch_enrollments 
  DROP CONSTRAINT IF EXISTS batch_enrollments_batch_id_fkey,
  DROP CONSTRAINT IF EXISTS batch_enrollments_student_id_fkey,
  ADD CONSTRAINT batch_enrollments_batch_id_fkey 
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  ADD CONSTRAINT batch_enrollments_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE materials 
  DROP CONSTRAINT IF EXISTS materials_batch_id_fkey,
  DROP CONSTRAINT IF EXISTS materials_uploaded_by_fkey,
  ADD CONSTRAINT materials_batch_id_fkey 
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  ADD CONSTRAINT materials_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE video_recordings 
  DROP CONSTRAINT IF EXISTS video_recordings_batch_id_fkey,
  DROP CONSTRAINT IF EXISTS video_recordings_uploaded_by_fkey,
  ADD CONSTRAINT video_recordings_batch_id_fkey 
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  ADD CONSTRAINT video_recordings_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE assignments 
  DROP CONSTRAINT IF EXISTS assignments_batch_id_fkey,
  DROP CONSTRAINT IF EXISTS assignments_created_by_fkey,
  ADD CONSTRAINT assignments_batch_id_fkey 
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  ADD CONSTRAINT assignments_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE assignment_submissions 
  DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_id_fkey,
  DROP CONSTRAINT IF EXISTS assignment_submissions_student_id_fkey,
  DROP CONSTRAINT IF EXISTS assignment_submissions_graded_by_fkey,
  ADD CONSTRAINT assignment_submissions_assignment_id_fkey 
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  ADD CONSTRAINT assignment_submissions_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT assignment_submissions_graded_by_fkey 
    FOREIGN KEY (graded_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE attendance_sessions 
  DROP CONSTRAINT IF EXISTS attendance_sessions_batch_id_fkey,
  DROP CONSTRAINT IF EXISTS attendance_sessions_created_by_fkey,
  ADD CONSTRAINT attendance_sessions_batch_id_fkey 
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  ADD CONSTRAINT attendance_sessions_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE attendance_records 
  DROP CONSTRAINT IF EXISTS attendance_records_session_id_fkey,
  DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey,
  ADD CONSTRAINT attendance_records_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  ADD CONSTRAINT attendance_records_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Verify data integrity
DO $$
DECLARE
  orphaned_count integer;
BEGIN
  -- Check for orphaned records
  SELECT COUNT(*) INTO orphaned_count FROM batch_enrollments 
  WHERE batch_id NOT IN (SELECT id FROM batches) OR student_id NOT IN (SELECT id FROM profiles);
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned batch_enrollments records', orphaned_count;
  END IF;
  
  SELECT COUNT(*) INTO orphaned_count FROM materials 
  WHERE batch_id NOT IN (SELECT id FROM batches);
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned materials records', orphaned_count;
  END IF;
  
  RAISE LOG 'Database integrity check completed';
END $$;

-- Update statistics for better query planning
ANALYZE profiles;
ANALYZE users;
ANALYZE user_sessions;
ANALYZE batches;
ANALYZE batch_enrollments;
ANALYZE materials;
ANALYZE video_recordings;
ANALYZE assignments;
ANALYZE assignment_submissions;
ANALYZE attendance_sessions;
ANALYZE attendance_records;

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Database cleanup and optimization completed successfully';
END $$;