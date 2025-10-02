import { format, parseISO } from 'date-fns';
import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

// Get user's timezone
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function formatDateToUTC(date: Date): string {
  // Convert the date to UTC, keeping the same calendar date
  const utcDate = zonedTimeToUtc(date, userTimeZone);
  return format(utcDate, 'yyyy-MM-dd');
}

export function formatDateForDisplay(date: Date): string {
  // Format the date in the user's timezone
  return formatInTimeZone(date, userTimeZone, 'EEEE, MMMM d, yyyy');
}

export function parseUTCDate(dateStr: string): Date {
  // Parse a UTC date string to a Date object
  const parsedDate = parseISO(dateStr);
  // Convert to user's timezone while preserving the date
  return utcToZonedTime(parsedDate, userTimeZone);
}

export function formatTimeForDisplay(time: string): string {
  // Time strings are already in 12-hour format with AM/PM
  return time;
}