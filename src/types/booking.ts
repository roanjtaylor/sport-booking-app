// src/types/booking.ts
import { User } from "@supabase/supabase-js";
import { Facility } from "./facility";

/**
 * Represents a booking for a facility
 */
export interface Booking {
  id: string;
  facility_id: string;
  user_id: string;
  date: string;
  start_time: string; // 24-hour format (HH:MM)
  end_time: string; // 24-hour format (HH:MM)
  status: BookingStatus;
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  facility?: Facility;
  user?: User;
  lobby_id?: string; // Reference to the lobby this booking was created from
  isLobbyParticipant?: boolean; // Flag to indicate if the current user is just a participant (not the booking creator)
}

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
