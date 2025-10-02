/*
  # Update provider locations

  1. Changes
    - Assign all doctors (except Dr. Kaminsky) to both Seattle and Bellevue locations
    - Keep Dr. Kaminsky only in Seattle location
    - Create appointment slots for new provider-location combinations

  2. Notes
    - Safe migration that maintains data integrity
    - Ensures proper provider distribution across locations
*/

-- Create new provider entries for Bellevue location
INSERT INTO providers (name, location_id)
SELECT 
  p.name,
  l.id AS bellevue_location_id
FROM providers p
CROSS JOIN (
  SELECT id 
  FROM locations 
  WHERE name = 'Bellevue'
) l
WHERE 
  p.name != 'Dr. Kaminsky'
  AND NOT EXISTS (
    SELECT 1 
    FROM providers p2 
    WHERE p2.name = p.name 
    AND p2.location_id = l.id
  );

-- Add appointment slots for the new provider-location combinations
INSERT INTO appointment_slots (
  provider_id,
  location_id,
  date,
  start_time,
  end_time,
  status
)
SELECT 
  p.id as provider_id,
  p.location_id,
  d.slot_date,
  t.start_time,
  t.end_time,
  'available' as status
FROM providers p
CROSS JOIN (
  SELECT generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '14 days',
    '1 day'::interval
  )::date as slot_date
) d
CROSS JOIN (
  SELECT 
    start_time,
    end_time
  FROM (VALUES
    ('9:00 AM', '9:50 AM'),
    ('10:00 AM', '10:50 AM'),
    ('11:00 AM', '11:50 AM'),
    ('2:00 PM', '2:50 PM'),
    ('3:00 PM', '3:50 PM')
  ) as t(start_time, end_time)
) t
WHERE 
  -- Only weekdays
  EXTRACT(DOW FROM d.slot_date) BETWEEN 1 AND 5
  -- Only for providers in Bellevue location
  AND EXISTS (
    SELECT 1 
    FROM locations l 
    WHERE l.id = p.location_id 
    AND l.name = 'Bellevue'
  )
  -- Don't create duplicate slots
  AND NOT EXISTS (
    SELECT 1 
    FROM appointment_slots a 
    WHERE a.provider_id = p.id 
    AND a.date = d.slot_date 
    AND a.start_time = t.start_time
  )
  -- Add some randomness to make it more realistic
  AND random() < 0.7;