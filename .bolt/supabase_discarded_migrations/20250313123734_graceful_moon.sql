/*
  # Update providers and their appointment slots

  1. Changes
    - Remove appointment slots for Dr. Sarah Johnson
    - Remove Dr. Sarah Johnson from providers
    - Add Dr. Lisa Anderson as new provider in Seattle
    - Add sample appointment slots for Dr. Lisa Anderson

  2. Notes
    - Safely removes old data
    - Adds new provider
    - Adds appointment slots with good distribution
*/

-- First, remove appointment slots for Dr. Sarah Johnson
DELETE FROM appointment_slots
WHERE provider_id IN (
  SELECT id 
  FROM providers 
  WHERE name = 'Dr. Sarah Johnson'
);

-- Remove Dr. Sarah Johnson
DELETE FROM providers
WHERE name = 'Dr. Sarah Johnson';

-- Add Dr. Lisa Anderson
WITH seattle_location AS (
  SELECT id FROM locations WHERE name = 'Seattle' LIMIT 1
)
INSERT INTO providers (name, location_id)
SELECT 'Dr. Lisa Anderson', id
FROM seattle_location;

-- Add appointment slots for Dr. Lisa Anderson
WITH new_provider AS (
  SELECT id as provider_id, location_id
  FROM providers
  WHERE name = 'Dr. Lisa Anderson'
),
dates AS (
  SELECT generate_series(
    CURRENT_DATE,
    '2024-03-27'::date,
    '1 day'::interval
  )::date as slot_date
),
times AS (
  SELECT unnest(ARRAY[
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM'
  ]) as slot_time
)
INSERT INTO appointment_slots (
  provider_id,
  location_id,
  date,
  time,
  status
)
SELECT 
  p.provider_id,
  p.location_id,
  d.slot_date,
  t.slot_time,
  'available'
FROM new_provider p
CROSS JOIN dates d
CROSS JOIN times t
WHERE 
  -- Only weekdays
  EXTRACT(DOW FROM d.slot_date) BETWEEN 1 AND 5
  -- Don't duplicate existing slots
  AND NOT EXISTS (
    SELECT 1 
    FROM appointment_slots a 
    WHERE a.provider_id = p.provider_id 
    AND a.date = d.slot_date 
    AND a.time = t.slot_time
  )
  AND random() < 0.8  -- Add some randomness to slot distribution
ORDER BY slot_date, slot_time
LIMIT 50;  -- Add a reasonable number of slots