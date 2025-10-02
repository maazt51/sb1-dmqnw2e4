import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { CalendarDays } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDateToUTC, formatDateForDisplay, parseUTCDate } from '../lib/date-utils';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  locationId?: string | null;
  providerId?: string | null;
}

export function Calendar({ onDateSelect, locationId, providerId }: CalendarProps) {
  const [selected, setSelected] = useState<Date>();
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset selection when provider changes
  useEffect(() => {
    if (selected) {
      setSelected(undefined);
    }
  }, [providerId]);

  useEffect(() => {
    async function fetchAvailableDates() {
      if (!locationId) {
        setAvailableDates([]);
        return;
      }

      setLoading(true);
      
      try {
        let query = supabase
          .from('appointment_slots')
          .select('date')
          .eq('status', 'available')
          .eq('location_id', locationId);

        if (providerId) {
          query = query.eq('provider_id', providerId);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          setAvailableDates([]);
          return;
        }

        // Convert string dates to Date objects and remove duplicates
        const dates = [...new Set(data.map(slot => slot.date))]
          .map(dateStr => parseUTCDate(dateStr));
        setAvailableDates(dates);
      } catch (err) {
        console.error('Error fetching available dates:', err);
        setAvailableDates([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailableDates();
  }, [locationId, providerId]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setSelected(date);
      onDateSelect(date);
    }
  };

  // Function to determine if a date should be disabled
  const isDateDisabled = (date: Date) => {
    // Convert both dates to UTC format for comparison
    const dateToCheck = formatDateToUTC(date);
    return !availableDates.some(availableDate => 
      formatDateToUTC(availableDate) === dateToCheck
    );
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-blue-400">
          {selected ? formatDateForDisplay(selected) : 'Select a date'}
        </h2>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <p className="text-gray-500">Loading available dates...</p>
        </div>
      ) : (
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={[
            { before: new Date() },
            { dayOfWeek: [0, 6] }, // Disable weekends
            isDateDisabled
          ]}
          className="w-full"
          modifiersClassNames={{
            selected: 'bg-blue-600 text-white hover:bg-blue-700',
            today: 'bg-gray-100 font-bold',
            disabled: 'text-gray-400 line-through'
          }}
          styles={{
            months: { width: '100%' },
            table: { width: '100%' },
            head_row: { display: 'flex', width: '100%', justifyContent: 'space-between' },
            head_cell: { flex: '1', textAlign: 'center' },
            row: { display: 'flex', width: '100%', justifyContent: 'space-between' },
            cell: { 
              flex: '1',
              textAlign: 'center',
              margin: '2px',
              padding: '8px 0',
              position: 'relative'
            },
            day: {
              width: '100%',
              height: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 200ms',
              cursor: 'pointer'
            }
          }}
        />
      )}
    </div>
  );
}