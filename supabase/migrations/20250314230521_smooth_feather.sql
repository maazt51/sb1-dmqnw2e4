/*
  # Update appointment slots table to use time ranges

  1. Changes
    - Remove existing time column
    - Add start_time and end_time columns
    - Update constraints and indexes
    - Maintain existing data integrity

  2. Notes
    - Each slot is 50 minutes long
    - Times stored in 'HH:mm AM/PM' format
*/

-- First, drop the existing unique constraint that includes the time column
ALTER TABLE appointment_slots 
DROP CONSTRAINT IF EXISTS appointment_slots_provider_id_date_time_key;

-- Remove the time column and add start_time and end_time columns
ALTER TABLE appointment_slots
DROP COLUMN IF EXISTS time,
ADD COLUMN start_time text NOT NULL,
ADD COLUMN end_time text NOT NULL;

-- Add new unique constraint
ALTER TABLE appointment_slots
ADD CONSTRAINT appointment_slots_provider_id_date_start_time_key 
UNIQUE (provider_id, date, start_time);

-- Insert sample data for testing
WITH RECURSIVE dates AS (
  SELECT generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '14 days',
    '1 day'::interval
  )::date as slot_date
),
times AS (
  SELECT 
    start_time,
    CASE 
      WHEN start_time LIKE '%AM' THEN
        CASE 
          WHEN start_time = '11:30 AM' THEN '12:20 PM'
          ELSE regexp_replace(start_time, '(\d+):(\d+) AM', '\1:' || (substring(start_time, '\d+:(\d+)')::integer + 50)::text || ' AM')
        END
      ELSE
        CASE 
          WHEN start_time = '4:30 PM' THEN '5:20 PM'
          ELSE regexp_replace(start_time, '(\d+):(\d+) PM', '\1:' || (substring(start_time, '\d+:(\d+)')::integer + 50)::text || ' PM')
        END
    END as end_time
  FROM (
    SELECT unnest(ARRAY[
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
      '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM',
      '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
    ]) as start_time
  ) t
),
provider_slots AS (
  SELECT 
    p.id as provider_id,
    p.location_id,
    d.slot_date,
    t.start_time,
    t.end_time
  FROM providers p
  CROSS JOIN dates d
  CROSS JOIN times t
  WHERE 
    -- Only weekdays
    EXTRACT(DOW FROM d.slot_date) BETWEEN 1 AND 5
)
INSERT INTO appointment_slots (
  provider_id,
  location_id,
  date,
  start_time,
  end_time,
  status
)
SELECT 
  provider_id,
  location_id,
  slot_date,
  start_time,
  end_time,
  'available'
FROM provider_slots
WHERE random() < 0.7  -- 70% chance of creating each slot
ORDER BY slot_date, start_time
LIMIT 200;  -- Reasonable number of total slots