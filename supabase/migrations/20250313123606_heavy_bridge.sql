/*
  # Add single appointment slot

  1. Changes
    - Add one appointment slot for Dr. Sarah Johnson in Seattle
    - Set for tomorrow at 10:00 AM
    - Status set as 'available'

  2. Notes
    - Ensures the slot doesn't already exist before inserting
    - Uses safe insertion with provider and location validation
*/

WITH provider_info AS (
  SELECT p.id as provider_id, p.location_id
  FROM providers p
  JOIN locations l ON p.location_id = l.id
  WHERE p.name = 'Dr. Sarah Johnson'
  AND l.name = 'Seattle'
  LIMIT 1
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
  CURRENT_DATE + INTERVAL '1 day',
  '10:00 AM',
  'available'
FROM provider_info
WHERE NOT EXISTS (
  SELECT 1 
  FROM appointment_slots a 
  WHERE a.provider_id = provider_info.provider_id
  AND a.date = CURRENT_DATE + INTERVAL '1 day'
  AND a.time = '10:00 AM'
);