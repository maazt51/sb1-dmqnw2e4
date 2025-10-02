/*
  # Add 10 new appointment slots

  1. Changes
    - Add 10 new appointment slots for existing providers
    - Distribute slots across different times and providers
    - All slots set as 'available'

  2. Notes
    - Slots are added for the next available dates
    - Times are distributed throughout the day
    - Ensures no duplicate slots are created
*/

WITH provider_slots AS (
  SELECT 
    p.id as provider_id,
    p.location_id,
    d.slot_date,
    t.slot_time
  FROM providers p
  CROSS JOIN (
    -- Next 3 business days
    SELECT generate_series(
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '5 days',
      INTERVAL '1 day'
    )::date as slot_date
  ) d
  CROSS JOIN (
    -- Various times throughout the day
    SELECT unnest(ARRAY[
      '9:00 AM',
      '10:30 AM',
      '11:30 AM',
      '2:00 PM',
      '3:30 PM'
    ]) as slot_time
  ) t
  WHERE 
    -- Only weekdays
    EXTRACT(DOW FROM d.slot_date) BETWEEN 1 AND 5
    -- Avoid existing slots
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
FROM (
  SELECT *
  FROM provider_slots
  ORDER BY random()  -- Randomize selection
  LIMIT 10
) selected_slots;