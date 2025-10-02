/*
  # Verify and create exam_slots table

  1. Table Structure
    - Ensures exam_slots table exists with correct columns
    - Adds sample data for testing

  2. Security
    - Enables RLS
    - Adds policy for reading slots
*/

-- Create exam_slots table if it doesn't exist
CREATE TABLE IF NOT EXISTS exam_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time text NOT NULL,
  booked_count integer NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(date, time)
);

-- Enable RLS if not already enabled
ALTER TABLE exam_slots ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exam_slots' 
    AND policyname = 'Anyone can read exam slots'
  ) THEN
    CREATE POLICY "Anyone can read exam slots"
      ON exam_slots
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Insert sample data for today and next 6 days
DO $$
DECLARE
  current_date date := CURRENT_DATE;
  slot_date date;
BEGIN
  FOR i IN 0..6 LOOP
    slot_date := current_date + i * INTERVAL '1 day';
    
    INSERT INTO exam_slots (date, time, is_available)
    VALUES
      (slot_date, '9:00 AM', true),
      (slot_date, '10:00 AM', true),
      (slot_date, '11:00 AM', true),
      (slot_date, '2:00 PM', true),
      (slot_date, '3:00 PM', true)
    ON CONFLICT (date, time) DO NOTHING;
  END LOOP;
END $$;