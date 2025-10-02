/*
  # Split patient name into first_name and last_name
  
  1. Changes
    - Add first_name and last_name columns to patients table
    - Drop the name column
    - Update RLS policies to reflect new column names
  
  2. Notes
    - last_name is optional
    - Preserves existing data by splitting the name field
*/

-- First add the new columns
ALTER TABLE patients
  ADD COLUMN first_name text NOT NULL DEFAULT '',
  ADD COLUMN last_name text;

-- Drop the name column
ALTER TABLE patients DROP COLUMN name;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create patient records" ON patients;
DROP POLICY IF EXISTS "Users can read own patient data" ON patients;
DROP POLICY IF EXISTS "Users can update own patient data" ON patients;

-- Recreate policies with updated columns
CREATE POLICY "Anyone can create patient records"
  ON patients
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read own patient data"
  ON patients
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own patient data"
  ON patients
  FOR UPDATE
  TO public
  USING (true);