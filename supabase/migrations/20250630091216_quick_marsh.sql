/*
  # Fix infinite recursion in batches policies

  1. Policy Updates
    - Drop existing problematic policies on batches table
    - Create simplified policies without circular dependencies
    - Ensure policies use direct user attributes instead of complex subqueries

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion in policy evaluation
*/

-- Drop existing policies that may cause infinite recursion
DROP POLICY IF EXISTS "batches_select_policy" ON batches;
DROP POLICY IF EXISTS "batches_insert_policy" ON batches;
DROP POLICY IF EXISTS "batches_update_policy" ON batches;
DROP POLICY IF EXISTS "batches_delete_policy" ON batches;

-- Create simplified policies without circular dependencies
CREATE POLICY "batches_select_policy" ON batches
  FOR SELECT
  TO public
  USING (
    -- Admin can see all batches
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Instructor can see their own batches
    (
      instructor_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'instructor'
      )
    )
    OR
    -- Student can see batches they are enrolled in
    EXISTS (
      SELECT 1 FROM batch_enrollments 
      WHERE batch_enrollments.batch_id = batches.id 
      AND batch_enrollments.student_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'student'
      )
    )
  );

CREATE POLICY "batches_insert_policy" ON batches
  FOR INSERT
  TO public
  WITH CHECK (
    -- Only admin and instructor can create batches
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "batches_update_policy" ON batches
  FOR UPDATE
  TO public
  USING (
    -- Admin can update all batches
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Instructor can update their own batches
    (
      instructor_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'instructor'
      )
    )
  );

CREATE POLICY "batches_delete_policy" ON batches
  FOR DELETE
  TO public
  USING (
    -- Only admin can delete batches
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );