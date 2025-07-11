/*
  # Fix RLS policies for batches table

  1. Security Updates
    - Add policy for admins to insert batches
    - Add policy for admins to update batches
    - Add policy for admins to delete batches
    - Ensure admins have full access to manage batches

  2. Changes
    - Create comprehensive policies for admin role
    - Allow admins to perform all CRUD operations on batches
    - Maintain existing policies for instructors and students
*/

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Admins can manage all batches" ON batches;
DROP POLICY IF EXISTS "Admins can insert batches" ON batches;
DROP POLICY IF EXISTS "Admins can update batches" ON batches;
DROP POLICY IF EXISTS "Admins can delete batches" ON batches;

-- Create comprehensive admin policies for batches
CREATE POLICY "Admins can manage all batches"
  ON batches
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Ensure the existing instructor policy is properly defined
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'batches' 
    AND policyname = 'Instructors can manage their batches'
  ) THEN
    CREATE POLICY "Instructors can manage their batches"
      ON batches
      FOR ALL
      TO authenticated
      USING (
        instructor_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        instructor_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Ensure the existing student read policy is properly defined
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'batches' 
    AND policyname = 'Students can read enrolled batches'
  ) THEN
    CREATE POLICY "Students can read enrolled batches"
      ON batches
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM batch_enrollments 
          WHERE batch_enrollments.batch_id = batches.id 
          AND batch_enrollments.student_id = auth.uid()
        ) OR 
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('instructor', 'admin')
        )
      );
  END IF;
END $$;