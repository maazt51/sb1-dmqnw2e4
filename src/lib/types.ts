// Database Types
export interface Location {
  id: string;
  name: string;
  created_at: string;
}

export interface Provider {
  id: string;
  name: string;
  location_id: string;
  created_at: string;
}

export interface AppointmentSlot {
  id: string;
  location_id: string;
  provider_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked';
  created_at: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name?: string | null;
  email: string | null;
  contact: string | null;
  returning_patient: boolean;
  sex?: 'male' | 'female';
  date_of_birth?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  patient_id: string;
  appointment_slot_id: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

// Join Types
export interface AppointmentSlotWithDetails extends AppointmentSlot {
  provider: Provider;
  location: Location;
}