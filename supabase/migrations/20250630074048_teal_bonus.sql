/*
  # Fix RLS policies for batches table

  1. Security Updates
    - Drop existing problematic policies for batches table
    - Create new policies with correct auth.uid() references
    - Ensure admins can insert, update, and delete batches
    - Ensure instructors can manage their own batches
    - Ensure students can read batches they're enrolled in

  2. Policy Changes
    - Fix admin policies to use auth.uid() instead of uid()
    - Ensure proper permissions for all user roles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert batches" ON batches;
DROP POLICY IF EXISTS "Admins can manage all batches" ON batches;
DROP POLICY IF EXISTS "Instructors can manage their batches" ON batches;
DROP POLICY IF EXISTS "Students can read enrolled batches" ON batches;

-- Create new policies with correct auth.uid() references

-- Allow admins to insert batches
CREATE POLICY "Admins can insert batches"
  ON batches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'::user_role
    )
  );

-- Allow admins to update batches
CREATE POLICY "Admins can update batches"
  ON batches
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'::user_role
    )
  );

-- Allow admins to delete batches
CREATE POLICY "Admins can delete batches"
  ON batches
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'::user_role
    )
  );

-- Allow instructors to manage their own batches
CREATE POLICY "Instructors can manage their batches"
  ON batches
  FOR ALL
  TO authenticated
  USING (
    instructor_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'::user_role
    )
  )
  WITH CHECK (
    instructor_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'::user_role
    )
  );

-- Allow students to read batches they're enrolled in
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
      AND profiles.role IN ('instructor'::user_role, 'admin'::user_role)
    )
  );