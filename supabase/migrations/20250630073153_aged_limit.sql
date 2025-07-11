/*
  # Fix RLS policy for batch creation by admins

  1. Security Changes
    - Add INSERT policy for admins to create new batches
    - Ensure admins can perform all CRUD operations on batches table

  The current policies only allow admins to manage existing batches, but don't 
  explicitly allow INSERT operations for new batch creation.
*/

-- Add policy to allow admins to insert new batches
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

-- Also ensure the existing "Admins can manage all batches" policy covers INSERT
-- by updating it to be more explicit about all operations
DROP POLICY IF EXISTS "Admins can manage all batches" ON batches;

CREATE POLICY "Admins can manage all batches"
  ON batches
  FOR ALL
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