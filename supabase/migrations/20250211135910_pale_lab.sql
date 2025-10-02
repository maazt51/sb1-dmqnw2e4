/*
  # Create exam booking system tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `exam_slots`
      - `id` (uuid, primary key)
      - `date` (date)
      - `time` (text)
      - `capacity` (integer)
      - `booked_count` (integer)
      - `is_available` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `rpa_logs`
      - `id` (uuid, primary key)
      - `action` (text)
      - `status` (text)
      - `details` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users,
  full_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Exam slots table
CREATE TABLE IF NOT EXISTS exam_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time text NOT NULL,
  capacity integer NOT NULL DEFAULT 1,
  booked_count integer NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(date, time),
  CONSTRAINT valid_booked_count CHECK (booked_count <= capacity)
);

ALTER TABLE exam_slots ENABLE ROW LEVEL SECURITY;

-- Anyone can read available exam slots
CREATE POLICY "Anyone can read exam slots"
  ON exam_slots
  FOR SELECT
  TO authenticated
  USING (true);

-- RPA logs table
CREATE TABLE IF NOT EXISTS rpa_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  status text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rpa_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access RPA logs
CREATE POLICY "Service role can manage RPA logs"
  ON rpa_logs
  TO service_role
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_slots_updated_at
  BEFORE UPDATE ON exam_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();