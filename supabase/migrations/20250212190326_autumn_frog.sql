/*
  # Fix exam slots and policies

  1. Changes
    - Drop and recreate RLS policies
    - Ensure public access to exam slots
    - Insert fresh test data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read exam slots" ON exam_slots;

-- Create new policy with public access
CREATE POLICY "Public read access for exam slots"
  ON exam_slots
  FOR SELECT
  TO public  -- This allows unauthenticated access
  USING (true);

-- Clear existing data and insert fresh test data
DELETE FROM exam_slots;

-- Insert fresh test data
DO $$
DECLARE
  current_date date := CURRENT_DATE;
  slot_date date;
BEGIN
  FOR i IN 0..6 LOOP
    slot_date := current_date + i * INTERVAL '1 day';
    
    INSERT INTO exam_slots (date, time, is_available, booked_count)
    VALUES
      (slot_date, '9:00 AM', true, 0),
      (slot_date, '10:00 AM', true, 0),
      (slot_date, '11:00 AM', true, 0),
      (slot_date, '2:00 PM', true, 0),
      (slot_date, '3:00 PM', true, 0);
  END LOOP;
END $$;