/*
  # Update bookings foreign key constraint

  1. Changes
    - Drop existing foreign key constraint on bookings.appointment_slot_id
    - Re-add constraint with ON DELETE SET NULL action
    - This allows appointment slots to be deleted while preserving booking records

  2. Security
    - Maintains referential integrity
    - Prevents orphaned booking records from causing errors
    - Allows for soft deletion of appointment slots
*/

-- First, make the appointment_slot_id column nullable if it isn't already
ALTER TABLE bookings 
ALTER COLUMN appointment_slot_id DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_appointment_slot_id_fkey;

-- Re-add the constraint with ON DELETE SET NULL
ALTER TABLE bookings
ADD CONSTRAINT bookings_appointment_slot_id_fkey
FOREIGN KEY (appointment_slot_id) 
REFERENCES appointment_slots(id) 
ON DELETE SET NULL;