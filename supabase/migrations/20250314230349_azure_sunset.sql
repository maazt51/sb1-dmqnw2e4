/*
  # Delete all appointment slots

  1. Changes
    - Delete all records from appointment_slots table
    - Safe operation as no other tables depend on these records
*/

-- Delete all records from appointment_slots
DELETE FROM appointment_slots;