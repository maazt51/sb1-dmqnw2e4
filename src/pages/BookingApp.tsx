import React, { useState, useEffect } from 'react';
import { Calendar } from '../components/calendar';
import { TimeSlots } from '../components/time-slots';
import { Button } from '../components/ui/button';
import { CalendarCheck, Stethoscope, MapPin, UserRound, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Provider, AppointmentSlotWithDetails } from '../lib/types';
import { PatientForm, type PatientFormData } from '../components/patient-form';
import { formatDateToUTC, formatDateForDisplay, formatTimeForDisplay } from '../lib/date-utils';

function BookingApp() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlotWithDetails | null>(null);
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showBookingSummary, setShowBookingSummary] = useState(false);
  const [patientData, setPatientData] = useState<PatientFormData | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<{ processId: string; state: string } | null>(null);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) {
        setError('Failed to load locations');
      } else if (data) {
        setLocations(data);
        setSelectedLocationId(data[0]?.id || null);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    const fetchProviders = async () => {
      if (!selectedLocationId) return;

      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('location_id', selectedLocationId)
        .order('name');

      if (error) {
        setError('Failed to load providers');
      } else if (data) {
        setProviders(data);
        setSelectedProviderId(null);
      }
    };

    fetchProviders();
  }, [selectedLocationId]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSelectedSlot(null);
    setShowPatientForm(false);
    setShowBookingSummary(false);
    setError(null);
    setBookingSuccess(null);
  };

  const handleTimeSelect = (time: string, slot: AppointmentSlotWithDetails) => {
    setSelectedTime(time);
    setSelectedSlot(slot);
    setShowPatientForm(true);
    setShowBookingSummary(false);
    setError(null);
    setBookingSuccess(null);
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocationId(event.target.value);
    setSelectedTime(null);
    setSelectedProviderId(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setShowPatientForm(false);
    setShowBookingSummary(false);
    setBookingSuccess(null);
  };

  const handleProviderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const providerId = event.target.value === 'first-available' ? null : event.target.value;
    setSelectedProviderId(providerId);
    setSelectedTime(null);
    setSelectedSlot(null);
    setShowPatientForm(false);
    setShowBookingSummary(false);
    setBookingSuccess(null);
  };

  const handlePatientFormSubmit = async (formData: PatientFormData) => {
    setPatientData(formData);
    setShowPatientForm(false);
    setShowBookingSummary(true);
  };

  const handlePatientFormCancel = () => {
    setShowPatientForm(false);
    setSelectedTime(null);
    setSelectedSlot(null);
  };

  const handleBookingConfirm = async () => {
    if (!selectedDate || !selectedTime || !selectedLocationId || !selectedSlot || !patientData) {
      setError('Missing required booking information.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Find existing patient or create new one
      let patientId: string;
      
      // Query for existing patient by email or phone
      const { data: existingPatients, error: patientQueryError } = await supabase
        .from('patients')
        .select('*')
        .or(`email.eq.${patientData.email},contact.eq.${patientData.phone}`)
        .limit(1);

      if (patientQueryError) {
        throw new Error(`Failed to check existing patients: ${patientQueryError.message}`);
      }

      if (existingPatients && existingPatients.length > 0) {
        // Patient exists
        const existingPatient = existingPatients[0];
        patientId = existingPatient.id;

        // Update returning_patient status if needed
        if (patientData.returningPatient && !existingPatient.returning_patient) {
          const { error: updateError } = await supabase
            .from('patients')
            .update({ returning_patient: true })
            .eq('id', patientId);

          if (updateError) {
            console.warn('Failed to update returning patient status:', updateError);
          }
        }
      } else {
        // Create new patient
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert([{
            first_name: patientData.firstName,
            last_name: patientData.lastName || null,
            email: patientData.email,
            contact: patientData.phone,
            returning_patient: patientData.returningPatient
          }])
          .select()
          .single();

        if (createError || !newPatient) {
          throw new Error(`Failed to create patient record: ${createError?.message}`);
        }

        patientId = newPatient.id;
      }

      // Step 2: Check for duplicate bookings within 90 days
      const timeframeStart = new Date(selectedDate);
      timeframeStart.setDate(timeframeStart.getDate() - 3);
      const timeframeEnd = new Date(selectedDate);
      timeframeEnd.setDate(timeframeEnd.getDate() + 3);

      const { data: existingBookings, error: bookingQueryError } = await supabase
        .from('bookings')
        .select(`
          *,
          appointment_slot:appointment_slots(date)
        `)
        .eq('patient_id', patientId)
        .eq('status', 'confirmed');

      if (bookingQueryError) {
        throw new Error(`Failed to check existing bookings: ${bookingQueryError.message}`);
      }

      if (existingBookings && existingBookings.length > 0) {
        // Check if any existing booking falls within the timeframe
        const duplicateBooking = existingBookings.find(booking => {
          if (!booking.appointment_slot?.date) return false;
          
          const bookingDate = new Date(booking.appointment_slot.date);
          return bookingDate >= timeframeStart && bookingDate <= timeframeEnd;
        });

        if (duplicateBooking) {
          setError('You already have a confirmed booking within 3 days. Please contact us if you need to book another appointment.');
          return;
        }
      }

      // First, update the appointment slot status to 'booked'
      const { error: slotUpdateError } = await supabase
        .from('appointment_slots')
        .update({ status: 'booked' })
        .eq('id', selectedSlot.id);

      if (slotUpdateError) {
        throw new Error(`Failed to update slot status: ${slotUpdateError.message}`);
      }

      // Step 3: Proceed with UiPath booking
      const bookingPayload = {
        patient: {
          firstName: patientData.firstName,
          lastName: patientData.lastName || '',
          email: patientData.email,
          phone: patientData.phone,
          dateOfBirth: formatDateToUTC(new Date(patientData.dateOfBirth)),
          returningPatient: patientData.returningPatient,
          gender: patientData.sex,
          referringDoctor: patientData.referringDoctor || '',
          reasonForVisit: patientData.reasonForVisit || ''
        },
        appointment: {
          date: formatDateToUTC(selectedDate),
          startTime: selectedSlot.start_time,
          endTime: selectedSlot.end_time,
          slotId: selectedSlot.id,
          locationId: selectedLocationId,
          providerId: selectedSlot.provider_id
        },
        location: {
          id: selectedLocationId,
          name: selectedSlot.location.name
        },
        provider: {
          id: selectedSlot.provider.id,
          name: selectedSlot.provider.name
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uipath-booking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(bookingPayload),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (!response.ok) {
        // If the UiPath booking fails, revert the slot status
        await supabase
          .from('appointment_slots')
          .update({ status: 'available' })
          .eq('id', selectedSlot.id);

        throw new Error(responseData.error || `Booking failed: ${response.statusText}`);
      }

      if (!responseData.success) {
        // If the UiPath booking fails, revert the slot status
        await supabase
          .from('appointment_slots')
          .update({ status: 'available' })
          .eq('id', selectedSlot.id);

        throw new Error(responseData.error || 'Failed to process booking request');
      }

      // Step 4: Create booking record in database
      const { error: bookingCreateError } = await supabase
        .from('bookings')
        .insert([{
          patient_id: patientId,
          appointment_slot_id: selectedSlot.id,
          status: 'confirmed'
        }]);

      if (bookingCreateError) {
        console.warn('Failed to create booking record:', bookingCreateError);
        // Don't throw error here as the UiPath booking was successful
      }

      // Clear selection
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedSlot(null);
      setShowPatientForm(false);
      setShowBookingSummary(false);
      setPatientData(null);

      // Show success message
      setBookingSuccess({
        processId: responseData.processId,
        state: responseData.state
      });
    } catch (err) {
      console.error('Booking error:', err);
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Booking request timed out. Please try again.');
        } else {
          setError(err.message || 'Failed to process booking request. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Stethoscope className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-2xl font-bold text-gray-900">Dental Appointment Booking</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {bookingSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-lg font-medium text-green-800 mb-2">Booking Received!</h3>
              <p className="text-green-700">Your appointment request has been received and is now being processed. It takes 5-10 minutes for bookings to be finalized.</p>
              <p className="text-green-700 mt-2">You will receive a confirmation email once your appointment is successfully booked in our system.</p>
            </div>
          )}

          {showPatientForm ? (
            <PatientForm
              onSubmit={handlePatientFormSubmit}
              onCancel={handlePatientFormCancel}
            />
          ) : showBookingSummary && selectedSlot && patientData ? (
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CalendarCheck className="h-5 w-5 mr-2 text-blue-600" />
                Booking Summary
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Patient Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {patientData.firstName} {patientData.lastName}</p>
                    <p><strong>Date of Birth:</strong> {formatDateForDisplay(new Date(patientData.dateOfBirth))}</p>
                    <p><strong>Phone:</strong> {patientData.phone}</p>
                    <p><strong>Email:</strong> {patientData.email}</p>
                    <p><strong>Patient Type:</strong> {patientData.returningPatient ? 'Returning Patient' : 'New Patient'}</p>
                    {patientData.referringDoctor && (
                      <p><strong>Referring Doctor:</strong> {patientData.referringDoctor}</p>
                    )}
                    {patientData.reasonForVisit && (
                      <p><strong>Reason for Visit:</strong> {patientData.reasonForVisit}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Appointment Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Location:</strong> {selectedLocation?.name}</p>
                    <p><strong>Provider:</strong> {selectedSlot.provider.name}</p>
                    <p><strong>Date:</strong> {formatDateForDisplay(selectedDate!)}</p>
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p><strong>Time:</strong> {formatTimeForDisplay(selectedSlot.start_time)} - {formatTimeForDisplay(selectedSlot.end_time)}</p>
                        <p className="text-sm text-gray-500">Time Zone: {timeZone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBookingSummary(false);
                    setShowPatientForm(true);
                  }}
                >
                  Edit Patient Info
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleBookingConfirm}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm Booking'}
                </Button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Location Selection */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Select Provider Location</h2>
                </div>
                <select
                  value={selectedLocationId || ''}
                  onChange={handleLocationChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider Selection */}
              {selectedLocationId && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <UserRound className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Choose Dr.</h2>
                  </div>
                  <select
                    value={selectedProviderId || 'first-available'}
                    onChange={handleProviderChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="first-available">First Available</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Booking Progress */}
              <div className="mb-8">
                <div className="flex items-center justify-center space-x-4">
                  <div className={`flex items-center ${selectedDate ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-current">
                      1
                    </div>
                    <span className="ml-2 font-medium">Select Date</span>
                  </div>
                  <div className={`flex-1 h-0.5 ${selectedDate ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  <div className={`flex items-center ${selectedTime ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-current">
                      2
                    </div>
                    <span className="ml-2 font-medium">Choose Time</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* Booking Interface */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Calendar 
                  onDateSelect={handleDateSelect}
                  locationId={selectedLocationId}
                  providerId={selectedProviderId}
                />
                <TimeSlots 
                  selectedDate={selectedDate}
                  locationId={selectedLocationId}
                  providerId={selectedProviderId}
                  onTimeSelect={handleTimeSelect}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default BookingApp;