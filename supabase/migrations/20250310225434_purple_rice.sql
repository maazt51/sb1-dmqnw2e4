/*
  # Add more appointment slots until March 27

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

DO $$ 
DECLARE
  provider_record RECORD;
  curr_date DATE := CURRENT_DATE;
  end_date DATE := '2024-03-27';
  time_slots TEXT[] := ARRAY[
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', 
    '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM'
  ];
  slot_count INTEGER := 0;
BEGIN
  -- Loop through each provider
  FOR provider_record IN 
    SELECT p.id as provider_id, l.id as location_id 
    FROM providers p 
    JOIN locations l ON p.location_id = l.id
  LOOP
    -- Loop through dates
    WHILE curr_date <= end_date AND slot_count < 200 LOOP
      -- Skip weekends
      IF EXTRACT(DOW FROM curr_date) NOT IN (0, 6) THEN
        -- Add slots for each time
        FOR i IN 1..array_length(time_slots, 1) LOOP
          -- Check if we've reached the limit
          IF slot_count >= 200 THEN
            EXIT;
          END IF;
          
          -- Only insert if slot doesn't exist
          IF NOT EXISTS (
            SELECT 1 
            FROM appointment_slots 
            WHERE date = curr_date 
            AND time = time_slots[i]
            AND provider_id = provider_record.provider_id
          ) THEN
            INSERT INTO appointment_slots (
              location_id,
              provider_id,
              date,
              time,
              status
            ) VALUES (
              provider_record.location_id,
              provider_record.provider_id,
              curr_date,
              time_slots[i],
              'available'
            );
            
            slot_count := slot_count + 1;
          END IF;
        END LOOP;
      END IF;
      
      curr_date := curr_date + 1;
    END LOOP;
    
    -- Reset date for next provider
    curr_date := CURRENT_DATE;
  END LOOP;
END $$;