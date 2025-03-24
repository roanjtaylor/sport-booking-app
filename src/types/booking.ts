// src/types/booking.ts
import { User } from "@supabase/supabase-js";
import { Facility } from "./facility";

/**
 * Represents a booking for a facility
 */
export type Booking = {
  id: string;
  facilityId: string;
  userId: string;
  date: string; // ISO date string
  startTime: string; // 24-hour format (HH:MM)
  endTime: string; // 24-hour format (HH:MM)
  status: BookingStatus;
  totalPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// From debugging
export type ExtendedBooking = Booking & {
  facility: Facility;
  user: User;
};

/**
 * Available booking statuses
 */
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

/**
 * Represents a time slot for booking
 */
export type TimeSlot = {
  startTime: string; // 24-hour format (HH:MM)
  endTime: string; // 24-hour format (HH:MM)
  available: boolean;
};
