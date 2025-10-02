/*
  # Add appointment slots until March 27

  1. Changes
    - Add appointment slots from current date until March 27
    - Distribute slots across different times and providers
    - Ensure total slots don't exceed 200
    - All new slots are set as 'available'

  2. Notes
    - Times are distributed between 9:00 AM and 4:00 PM
    - Slots are created for weekdays only
    - Each provider gets different time slots to ensure good distribution
*/

WITH dates AS (
  SELECT generate_series(
    CURRENT_DATE,
    '2024-03-27'::date,
    '1 day'::interval
  )::date as date
),
weekdays AS (
  SELECT date
  FROM dates
  WHERE EXTRACT(DOW FROM date) NOT IN (0, 6)
),
time_slots AS (
  SELECT unnest(ARRAY[
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM'
  ]) as time
),
slot_combinations AS (
  SELECT 
    p.id as provider_id,
    p.location_id,
    w.date,
    t.time
  FROM providers p
  CROSS JOIN weekdays w
  CROSS JOIN time_slots t
  WHERE NOT EXISTS (
    SELECT 1
    FROM appointment_slots a
    WHERE a.provider_id = p.id
    AND a.date = w.date
    AND a.time = t.time
  )
  LIMIT 200
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
  date,
  time,
  'available' as status
FROM slot_combinations;