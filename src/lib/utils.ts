// src/lib/utils.ts
import { format, parse, isValid } from "date-fns";
import { TimeSlot } from "@/types/booking";
import { OperatingHours, TimeRange } from "@/types/facility";

/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateString: string) {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
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
    // Split the time string into hours and minutes
    const [hours, minutes] = timeString.split(":").map(Number);

    // Convert to 12-hour format
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM

    // Format as "1:30 PM"
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
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
) {
  // Convert times to minutes since midnight
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // Calculate duration in hours
  const durationHours = (endMinutes - startMinutes) / 60;

  // Calculate total price
  return pricePerHour * durationHours;
}
