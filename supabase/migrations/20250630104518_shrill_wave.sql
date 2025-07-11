/*
  # Add attendance_token column to attendance_sessions table

  1. Changes
    - Add `attendance_token` column to `attendance_sessions` table
    - Column is TEXT type, nullable, and unique
    - This will allow the attendance link generation functionality to work properly

  2. Security
    - No RLS changes needed as the table already has proper policies
*/

-- Add the missing attendance_token column to attendance_sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_sessions' AND column_name = 'attendance_token'
  ) THEN
    ALTER TABLE attendance_sessions ADD COLUMN attendance_token text UNIQUE;
  END IF;
END $$;