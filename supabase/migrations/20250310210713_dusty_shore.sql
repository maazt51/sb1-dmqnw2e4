/*
  # Medical Booking System Schema

  1. New Tables
    - locations
      - id (uuid, primary key)
      - name (text, unique)
      - created_at (timestamp)
    
    - providers
      - id (uuid, primary key)
      - name (text)
      - location_id (uuid, foreign key)
      - created_at (timestamp)
    
    - appointment_slots
      - id (uuid, primary key)
      - location_id (uuid, foreign key)
      - provider_id (uuid, foreign key)
      - date (date)
      - time (text)
      - status (text) - either 'available' or 'booked'
      - created_at (timestamp)
    
    - patients
      - id (uuid, primary key)
      - name (text)
      - email (text, unique)
      - contact (text)
      - created_at (timestamp)
    
    - bookings
      - id (uuid, primary key)
      - patient_id (uuid, foreign key)
      - appointment_slot_id (uuid, foreign key)
      - status (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS appointment_slots;
DROP TABLE IF EXISTS providers;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS locations;

-- Create locations table
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create providers table
CREATE TABLE providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_id uuid NOT NULL REFERENCES locations(id),
  created_at timestamptz DEFAULT now()
);

-- Create patients table
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  contact text,
  created_at timestamptz DEFAULT now()
);

-- Create appointment_slots table
CREATE TABLE appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  provider_id uuid NOT NULL REFERENCES providers(id),
  date date NOT NULL,
  time text NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'booked')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, date, time)
);

-- Create bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  appointment_slot_id uuid NOT NULL REFERENCES appointment_slots(id),
  status text NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Locations: Anyone can read
CREATE POLICY "Anyone can read locations"
  ON locations
  FOR SELECT
  TO public
  USING (true);

-- Providers: Anyone can read
CREATE POLICY "Anyone can read providers"
  ON providers
  FOR SELECT
  TO public
  USING (true);

-- Patients: Users can read and update their own data
CREATE POLICY "Users can read own patient data"
  ON patients
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own patient data"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Appointment Slots: Anyone can read available slots
CREATE POLICY "Anyone can read appointment slots"
  ON appointment_slots
  FOR SELECT
  TO public
  USING (true);

-- Bookings: Users can read and create their own bookings
CREATE POLICY "Users can read own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (patient_id::text = auth.uid()::text);

CREATE POLICY "Users can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id::text = auth.uid()::text);

-- Insert initial data
INSERT INTO locations (name) VALUES
  ('Seattle'),
  ('Bellevue');

-- Insert sample providers
INSERT INTO providers (name, location_id) 
SELECT 
  'Dr. Smith',
  id
FROM locations 
WHERE name = 'Seattle'
UNION ALL
SELECT 
  'Dr. Johnson',
  id
FROM locations 
WHERE name = 'Bellevue';