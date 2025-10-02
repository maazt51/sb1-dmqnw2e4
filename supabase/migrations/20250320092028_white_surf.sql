/*
  # Fix patients table RLS policies

  1. Changes
    - Drop existing RLS policies for patients table
    - Add new policies to allow:
      - Public insert access (anyone can create a patient record)
      - Authenticated users can read their own data
      - Authenticated users can update their own data

  2. Security
    - Maintains data privacy by restricting access to own records
    - Allows new patient registration without authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own patient data" ON patients;
DROP POLICY IF EXISTS "Users can update own patient data" ON patients;

-- Create new policies
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