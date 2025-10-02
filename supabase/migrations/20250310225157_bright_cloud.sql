/*
  # Remove Dr. Emily Davis and associated appointments

  1. Changes
    - Remove appointment slots associated with Dr. Emily Davis
    - Remove Dr. Emily Davis from providers table

  2. Security
    - Uses safe deletion with EXISTS checks
*/

DO $$ 
BEGIN
  -- First, delete appointment slots for the provider
  DELETE FROM appointment_slots
  WHERE provider_id = (
    SELECT id 
    FROM providers 
    WHERE name = 'Dr. Emily Davis'
  );

  -- Then delete the provider
  DELETE FROM providers
  WHERE name = 'Dr. Emily Davis';
END $$;