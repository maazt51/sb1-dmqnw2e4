/*
  # Add returning_patient column to patients table
  
  1. Changes
    - Add returning_patient column with boolean type
    - Set default value to false
    - Make column NOT NULL
  
  2. Notes
    - Safe migration that preserves existing data
    - All existing patients will have returning_patient set to false by default
*/

-- Add returning_patient column
ALTER TABLE patients
  ADD COLUMN returning_patient boolean NOT NULL DEFAULT false;

-- Update the type definition in the application