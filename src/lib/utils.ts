// src/lib/utils.ts
import { format, parse, isValid } from "date-fns";
import { TimeSlot } from "@/types/booking";
import { OperatingHours, TimeRange } from "@/types/facility";

/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateString: string, formatString: string = "PPP") {
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return "Invalid date";
    return format(date, formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
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
  try {
    return new Intl.NumberFormat("en-US", {
      // POSSIBLE ERROR BUG
      style: "currency",
      currency,
    }).format(price);
  } catch (error) {
    console.error("Error formatting price:", error);
    return `${price} ${currency}`;
  }
}

/**
 * Convert operating hours to an array of available time slots for a given day
 */
export function generateTimeSlots(
  operatingHours: OperatingHours,
  day: keyof OperatingHours,
  durationMinutes: number = 60, // Default 1 hour slots
  existingBookings: { startTime: string; endTime: string; date?: string }[] = []
): TimeSlot[] {
  const dayHours = operatingHours[day];

  // If the facility is closed on this day
  if (!dayHours) return [];

  const slots: TimeSlot[] = [];
  const timeRange = dayHours as TimeRange;

  // Parse opening and closing times
  try {
    const startTime = parse(timeRange.open, "HH:mm", new Date());
    const endTime = parse(timeRange.close, "HH:mm", new Date());

    // Create time slots
    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const slotStart = format(currentTime, "HH:mm");

      // Add duration minutes to the current time
      const nextTime = new Date(currentTime);
      nextTime.setMinutes(nextTime.getMinutes() + durationMinutes);

      // If this would go beyond closing time, break
      if (nextTime > endTime) break;

      const slotEnd = format(nextTime, "HH:mm");

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

      currentTime = nextTime;
    }

    return slots;
  } catch (error) {
    console.error("Error generating time slots:", error);
    return [];
  }
}

/**
 * Get the day of the week from a date string
 */
export function getDayOfWeek(dateString: string): keyof OperatingHours {
  try {
    const date = new Date(dateString);
    const days: (keyof OperatingHours)[] = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    return days[date.getDay()];
  } catch (error) {
    console.error("Error getting day of week:", error);
    return "monday"; // Default to Monday on error
  }
}

/**
 * Calculate the total price for a booking based on start and end times
 */
export function calculateTotalPrice(
  startTime: string,
  endTime: string,
  pricePerHour: number
): number {
  try {
    const start = parse(startTime, "HH:mm", new Date());
    const end = parse(endTime, "HH:mm", new Date());

    // Calculate duration in hours
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    // Calculate total price
    return durationHours * pricePerHour;
  } catch (error) {
    console.error("Error calculating total price:", error);
    return pricePerHour; // Default to hourly price on error
  }
}
