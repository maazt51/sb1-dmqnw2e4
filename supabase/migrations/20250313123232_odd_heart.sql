/*
  # Add more appointment slots

  1. Changes
    - Add appointment slots from current date until March 27
    - Distribute slots across different times and providers
    - All new slots are set as 'available'

  2. Notes
    - Times are distributed between 9:00 AM and 4:00 PM
    - Slots are created for weekdays only
    - Each provider gets different time slots to ensure good distribution
*/

-- Insert new slots for each provider
WITH RECURSIVE dates AS (
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
    -- Don't duplicate existing slots
    AND NOT EXISTS (
      SELECT 1 
      FROM appointment_slots a 
      WHERE a.provider_id = p.id 
      AND a.date = d.slot_date 
      AND a.time = t.slot_time
    )
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
WHERE random() < 0.8  -- Add some randomness to slot distribution
ORDER BY slot_date, slot_time
LIMIT 150;  -- Keep total new slots reasonable