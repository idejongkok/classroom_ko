/*
  # Fix assignment_status enum to include reviewed and returned values

  1. Changes
    - Remove default value temporarily
    - Create new enum type with all required values
    - Update column to use new enum type
    - Replace old enum type
    - Restore default value
    - Update existing 'graded' records to 'reviewed'

  2. Security
    - No RLS changes needed
*/

-- Step 1: Remove the default value temporarily
ALTER TABLE assignment_submissions ALTER COLUMN status DROP DEFAULT;

-- Step 2: Create a new enum type with all the values we need
CREATE TYPE assignment_status_new AS ENUM ('pending', 'submitted', 'graded', 'reviewed', 'returned');

-- Step 3: Update the table to use the new enum type
ALTER TABLE assignment_submissions 
  ALTER COLUMN status TYPE assignment_status_new 
  USING status::text::assignment_status_new;

-- Step 4: Drop the old enum type
DROP TYPE assignment_status;

-- Step 5: Rename the new enum type to the original name
ALTER TYPE assignment_status_new RENAME TO assignment_status;

-- Step 6: Restore the default value
ALTER TABLE assignment_submissions ALTER COLUMN status SET DEFAULT 'pending'::assignment_status;

-- Step 7: Update any existing 'graded' status to 'reviewed' for consistency
UPDATE assignment_submissions 
SET status = 'reviewed' 
WHERE status = 'graded';