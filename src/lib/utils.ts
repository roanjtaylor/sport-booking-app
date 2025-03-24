// src/lib/utils.ts
import { format, parse, isValid } from "date-fns";
import { TimeSlot } from "@/types/booking";
import { OperatingHours, TimeRange } from "@/types/facility";

/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateString: string, formatString: string = "PPP") {
  const date = new Date(dateString);
  if (!isValid(date)) return "Invalid date";
  return format(date, formatString);
}

/**
 * Format a time string from 24-hour format to 12-hour format
 */
export function formatTime(timeString: string) {
  if (!timeString) return "";

  try {
    // Parse the time string (assuming it's in 24-hour format)
    const date = parse(timeString, "HH:mm", new Date());
    if (!isValid(date)) return timeString;

    // Format to 12-hour format
    return format(date, "h:mm a");
  } catch (error) {
    console.error("Error formatting time:", error);
    return timeString;
  }
}

/**
 * Create a formatted price string with currency
 */
export function formatPrice(price: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

/**
 * Convert operating hours to an array of available time slots for a given day
 */
export function generateTimeSlots(
  operatingHours: OperatingHours,
  day: keyof OperatingHours,
  durationMinutes: number = 60, // Default 1 hour slots
  existingBookings: { startTime: string; endTime: string }[] = []
): TimeSlot[] {
  const dayHours = operatingHours[day];

  // If the facility is closed on this day
  if (!dayHours) return [];

  const slots: TimeSlot[] = [];
  const timeRange = dayHours as TimeRange;

  // Parse opening and closing times
  const startTime = parse(timeRange.open, "HH:mm", new Date());
  const endTime = parse(timeRange.close, "HH:mm", new Date());

  // Create time slots
  let currentTime = startTime;
  while (currentTime < endTime) {
    const slotStart = format(currentTime, "HH:mm");

    // Add duration minutes to the current time
    currentTime.setMinutes(currentTime.getMinutes() + durationMinutes);

    // If this would go beyond closing time, break
    if (currentTime > endTime) break;

    const slotEnd = format(currentTime, "HH:mm");

    // Check if this slot overlaps with any existing bookings
    const isAvailable = !existingBookings.some((booking) => {
      const bookingStart = booking.startTime;
      const bookingEnd = booking.endTime;

      // Check for overlap
      return (
        (slotStart >= bookingStart && slotStart < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (slotStart <= bookingStart && slotEnd >= bookingEnd)
      );
    });

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: isAvailable,
    });
  }

  return slots;
}

/**
 * Get the day of the week from a date string
 */
export function getDayOfWeek(dateString: string): keyof OperatingHours {
  const date = new Date(dateString);
  const days: (keyof OperatingHours)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()];
}

/**
 * Calculate the total price for a booking based on start and end times
 */
export function calculateTotalPrice(
  startTime: string,
  endTime: string,
  pricePerHour: number
): number {
  const start = parse(startTime, "HH:mm", new Date());
  const end = parse(endTime, "HH:mm", new Date());

  // Calculate duration in hours
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  // Calculate total price
  return durationHours * pricePerHour;
}
