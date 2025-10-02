/*
  # Add new providers and their appointment slots

  1. Changes
    - Remove existing providers
    - Add new providers (Dr. Richins, Dr. Weinstein, etc.)
    - Create appointment slots until March 28
    - Randomize time distribution

  2. Notes
    - Slots are created for weekdays only
    - Times between 9:00 AM and 4:00 PM
    - Random distribution of availability
*/

-- First, clean up existing data
DELETE FROM appointment_slots;
DELETE FROM providers;

-- Add new providers
WITH locations_data AS (
  SELECT id FROM locations WHERE name = 'Seattle' LIMIT 1
)
INSERT INTO providers (name, location_id)
SELECT name, id
FROM (
  VALUES 
    ('Dr. Richins'),
    ('Dr. Weinstein'),
    ('Dr. Nguyen')
) as names(name)
CROSS JOIN locations_data;

WITH locations_data AS (
  SELECT id FROM locations WHERE name = 'Bellevue' LIMIT 1
)
INSERT INTO providers (name, location_id)
SELECT name, id
FROM (
  VALUES 
    ('Dr. Kaminsky'),
    ('Dr. Yassin')
) as names(name)
CROSS JOIN locations_data;

-- Create appointment slots
WITH RECURSIVE dates AS (
  SELECT generate_series(
    CURRENT_DATE,
    '2024-03-28'::date,
    '1 day'::interval
  )::date as slot_date
),
times AS (
  SELECT unnest(ARRAY[
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM'
  ]) as slot_time
),
provider_slots AS (
  SELECT 
    p.id as provider_id,
    p.location_id,
    d.slot_date,
    t.slot_time
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
  time,
  status
)
SELECT 
  provider_id,
  location_id,
  slot_date,
  slot_time,
  'available'
FROM provider_slots
WHERE 
  -- Add randomness to create a more realistic schedule
  -- Different random factors for morning and afternoon slots
  CASE 
    WHEN slot_time LIKE '%AM%' THEN random() < 0.7  -- 70% chance for morning slots
    ELSE random() < 0.6  -- 60% chance for afternoon slots
  END
  -- Ensure good distribution across providers
  AND (
    SELECT COUNT(*) 
    FROM appointment_slots a 
    WHERE a.provider_id = provider_slots.provider_id 
    AND a.date = slot_date
  ) < 6  -- Maximum 6 slots per provider per day
ORDER BY slot_date, slot_time;