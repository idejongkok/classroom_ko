/*
  # Fix infinite recursion in batches RLS policies

  1. Problem
    - The current RLS policies on batches table are causing infinite recursion
    - This happens when policies reference functions or other policies that create circular dependencies

  2. Solution
    - Drop existing problematic policies
    - Create new, simpler policies that avoid recursion
    - Use direct auth.uid() instead of get_current_user_profile() function calls
    - Simplify policy logic to prevent circular references

  3. Security
    - Maintain proper access control for different user roles
    - Ensure students can only see batches they're enrolled in
    - Ensure instructors can see batches they teach
    - Ensure admins can see all batches
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "batches_select_policy" ON batches;
DROP POLICY IF EXISTS "batches_insert_policy" ON batches;
DROP POLICY IF EXISTS "batches_update_policy" ON batches;
DROP POLICY IF EXISTS "batches_delete_policy" ON batches;

-- Create new simplified policies that avoid recursion

-- Select policy: Allow users to see batches based on their role and enrollment
CREATE POLICY "batches_select_policy" ON batches
  FOR SELECT
  TO authenticated
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
    -- Student can see batches they're enrolled in
    (
      EXISTS (
        SELECT 1 FROM batch_enrollments 
        WHERE batch_enrollments.batch_id = batches.id 
        AND batch_enrollments.student_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'student'
      )
    )
  );

-- Insert policy: Only admins and instructors can create batches
CREATE POLICY "batches_insert_policy" ON batches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Update policy: Admins can update any batch, instructors can update their own batches
CREATE POLICY "batches_update_policy" ON batches
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    (
      instructor_id = auth.uid() 
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'instructor'
      )
    )
  );

-- Delete policy: Only admins can delete batches
CREATE POLICY "batches_delete_policy" ON batches
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );