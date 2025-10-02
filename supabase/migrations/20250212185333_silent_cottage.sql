/*
  # Update exam slots schema and add morning slots
  
  1. Changes
    - Add missing columns to exam_slots table (capacity, booked_count)
    - Insert morning time slots (8:00 AM to 12:00 PM) for the next 7 days
    - Each slot has a capacity of 2 students
*/

-- First add the missing columns if they don't exist
DO $$ 
BEGIN
  -- Add capacity column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'exam_slots' 
    AND column_name = 'capacity'
  ) THEN
    ALTER TABLE exam_slots ADD COLUMN capacity integer NOT NULL DEFAULT 1;
  END IF;

  -- Add booked_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'exam_slots' 
    AND column_name = 'booked_count'
  ) THEN
    ALTER TABLE exam_slots ADD COLUMN booked_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Then insert the morning slots
DO $$
DECLARE
  current_date date := CURRENT_DATE;
  slot_date date;
BEGIN
  FOR i IN 0..6 LOOP
    slot_date := current_date + i * INTERVAL '1 day';
    
    -- Morning slots
    INSERT INTO exam_slots (date, time, is_available)
    VALUES
      (slot_date, '8:00 AM', true),
      (slot_date, '9:00 AM', true),
      (slot_date, '10:00 AM', true),
      (slot_date, '11:00 AM', true),
      (slot_date, '12:00 PM', true)
    ON CONFLICT (date, time) DO NOTHING;

    -- Update capacity for the inserted slots
    UPDATE exam_slots 
    SET capacity = 2
    WHERE date = slot_date 
    AND time IN ('8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM');
  END LOOP;
END $$;