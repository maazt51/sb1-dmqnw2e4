/*
  # Add sample data for providers and appointment slots

  1. Sample Data
    - Add 4 providers across Seattle and Bellevue locations
    - Add 5 appointment slots with different times and providers
*/

-- Insert sample providers
INSERT INTO providers (name, location_id)
SELECT 'Dr. Sarah Johnson', id
FROM locations
WHERE name = 'Seattle'
ON CONFLICT DO NOTHING;

INSERT INTO providers (name, location_id)
SELECT 'Dr. Michael Chen', id
FROM locations
WHERE name = 'Seattle'
ON CONFLICT DO NOTHING;

INSERT INTO providers (name, location_id)
SELECT 'Dr. Emily Davis', id
FROM locations
WHERE name = 'Bellevue'
ON CONFLICT DO NOTHING;

INSERT INTO providers (name, location_id)
SELECT 'Dr. Robert Wilson', id
FROM locations
WHERE name = 'Bellevue'
ON CONFLICT DO NOTHING;

-- Insert sample appointment slots for today and tomorrow
WITH provider_locations AS (
  SELECT p.id as provider_id, p.location_id
  FROM providers p
)
INSERT INTO appointment_slots (location_id, provider_id, date, time, status)
SELECT 
  pl.location_id,
  pl.provider_id,
  CURRENT_DATE + (n || ' days')::interval,
  time_slot,
  'available'
FROM provider_locations pl
CROSS JOIN (
  SELECT unnest(ARRAY['9:00 AM', '10:30 AM', '2:00 PM', '3:30 PM', '4:45 PM']) as time_slot
) times
CROSS JOIN (
  SELECT generate_series(0, 1) as n
) dates
WHERE random() < 0.7  -- Randomly select ~70% of possible combinations
ON CONFLICT DO NOTHING;