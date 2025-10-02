import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AppointmentSlotWithDetails } from '../lib/types';
import { formatDateToUTC, formatTimeForDisplay } from '../lib/date-utils';

interface TimeSlotsProps {
  selectedDate: Date | null;
  locationId: string | null;
  providerId: string | null;
  onTimeSelect: (time: string, slot: AppointmentSlotWithDetails) => void;
}

export function TimeSlots({ selectedDate, locationId, providerId, onTimeSelect }: TimeSlotsProps) {
  const [slots, setSlots] = useState<AppointmentSlotWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDate || !locationId) {
        setSlots([]);
        return;
      }

      setLoading(true);
      setError(null);
      const formattedDate = formatDateToUTC(selectedDate);
      
      try {
        let query = supabase
          .from('appointment_slots')
          .select(`
            *,
            provider:providers(id, name),
            location:locations(id, name)
          `)
          .eq('date', formattedDate)
          .eq('location_id', locationId)
          .eq('status', 'available');

        if (providerId) {
          query = query.eq('provider_id', providerId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        if (!data || data.length === 0) {
          setSlots([]);
          return;
        }

        // Convert time strings to comparable format for proper sorting
        const convertTimeToMinutes = (timeStr: string) => {
          const [time, period] = timeStr.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };

        // Sort slots by start_time
        const sortedSlots = data.sort((a, b) => {
          const timeA = convertTimeToMinutes(a.start_time);
          const timeB = convertTimeToMinutes(b.start_time);
          if (timeA !== timeB) return timeA - timeB;
          return a.provider.name.localeCompare(b.provider.name);
        });

        // If First Available is selected (no providerId), show earliest slot for each provider
        if (!providerId && sortedSlots.length > 0) {
          // Group slots by provider
          const providerSlots = new Map<string, AppointmentSlotWithDetails>();
          
          // For each provider, keep only their earliest slot
          sortedSlots.forEach(slot => {
            const providerId = slot.provider_id;
            if (!providerSlots.has(providerId)) {
              providerSlots.set(providerId, slot);
            }
          });
          
          // Convert map back to array
          setSlots(Array.from(providerSlots.values()));
        } else {
          setSlots(sortedSlots);
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError('Failed to load time slots. Please try again.');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSlots();
  }, [selectedDate, locationId, providerId]);

  if (!selectedDate || !locationId) return null;

  if (loading) {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-lg">
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500">Loading available slots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-lg">
        <div className="flex items-center justify-center h-40">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  // Group slots by AM/PM
  const amSlots = slots.filter(slot => slot.start_time.includes('AM'));
  const pmSlots = slots.filter(slot => slot.start_time.includes('PM'));

  return (
    <div className="border rounded-lg p-4 bg-white shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold">Available Time Slots</h2>
      </div>
      
      {slots.length === 0 ? (
        <p className="text-center text-gray-500 py-4">
          No available slots for {formatDateToUTC(selectedDate)}.
        </p>
      ) : (
        <>
          {/* AM Slots */}
          {amSlots.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">AM</h3>
              <div className="grid grid-cols-3 gap-2">
                {amSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant="outline"
                    className="w-full"
                    onClick={() => onTimeSelect(slot.start_time, slot)}
                  >
                    <div>
                      <div>{formatTimeForDisplay(slot.start_time)}</div>
                      {!providerId && (
                        <div className="text-xs text-gray-500">
                          {slot.provider.name}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* PM Slots */}
          {pmSlots.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">PM</h3>
              <div className="grid grid-cols-3 gap-2">
                {pmSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant="outline"
                    className="w-full"
                    onClick={() => onTimeSelect(slot.start_time, slot)}
                  >
                    <div>
                      <div>{formatTimeForDisplay(slot.start_time)}</div>
                      {!providerId && (
                        <div className="text-xs text-gray-500">
                          {slot.provider.name}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}