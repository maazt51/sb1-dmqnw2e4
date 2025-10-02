/*
  # Make email optional in patients table

  1. Changes
    - Remove unique constraint on email
    - Make email column nullable
    - Keep existing data and policies intact

  2. Notes
    - This is a safe migration that preserves existing data
    - Allows multiple patients with the same email or no email
*/

-- Drop the unique constraint on email
ALTER TABLE patients 
DROP CONSTRAINT IF EXISTS patients_email_key;

-- Make email column nullable
ALTER TABLE patients 
ALTER COLUMN email DROP NOT NULL;