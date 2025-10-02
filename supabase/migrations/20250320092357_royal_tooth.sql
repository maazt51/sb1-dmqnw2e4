/*
  # Update bookings table RLS policies
  
  1. Changes
    - Drop existing restrictive policies
    - Add new policies allowing public access for creating and reading bookings
  
  2. Security
    - Allow public access to create bookings
    - Allow public access to read bookings
    - Maintain data integrity through foreign key constraints
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;

-- Create new policies for public access
CREATE POLICY "Public can create bookings"
  ON bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can read bookings"
  ON bookings
  FOR SELECT
  TO public
  USING (true);