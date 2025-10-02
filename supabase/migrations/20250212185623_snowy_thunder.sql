/*
  # Remove capacity column from exam_slots table

  1. Changes
    - Remove capacity column from exam_slots table
    - Remove capacity-related constraint
  
  2. Notes
    - This is a safe migration that preserves existing data
    - Only removes the capacity column and its related constraint
*/

-- Remove the capacity-related constraint first
ALTER TABLE exam_slots DROP CONSTRAINT IF EXISTS valid_booked_count;

-- Create a new constraint without capacity
ALTER TABLE exam_slots 
  ADD CONSTRAINT valid_booked_count 
  CHECK (booked_count <= 1);

-- Remove the capacity column
ALTER TABLE exam_slots DROP COLUMN IF EXISTS capacity;