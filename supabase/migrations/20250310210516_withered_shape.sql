/*
  # Add location support to exam slots
  
  1. Changes
    - Add location column to exam_slots table
    - Update existing slots with default locations
*/

-- Add location column to exam_slots
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'exam_slots' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE exam_slots ADD COLUMN location text NOT NULL DEFAULT 'Seattle';
  END IF;
END $$;

-- Update existing slots to have locations
UPDATE exam_slots
SET location = (
  CASE 
    WHEN random() > 0.5 THEN 'Seattle'
    ELSE 'Bellevue'
  END
)
WHERE location = 'Seattle';