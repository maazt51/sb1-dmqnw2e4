/*
  # Create bookings schema

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `time` (text)
      - `created_at` (timestamp)
      - `status` (text)

  2. Security
    - Enable RLS on `bookings` table
    - Add policies for:
      - Users can read their own bookings
      - Users can create their own bookings
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  UNIQUE(date, time)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own bookings
CREATE POLICY "Users can read own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to create their own bookings
CREATE POLICY "Users can create own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);