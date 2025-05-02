// src/lib/api/bookings.ts
import { supabase } from "@/lib/supabase";
import { Booking, BookingStatus } from "@/types/booking";

/**
 * Fetches all bookings for a given user
 */
export async function getUserBookings(userId: string) {
  try {
    // Fetch direct bookings
    const { data: directBookings, error: directBookingsError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        facility:facility_id(*)
      `
      )
      .eq("user_id", userId)
      .order("date", { ascending: true });

    if (directBookingsError) throw directBookingsError;

    // Fetch lobby bookings where user is a participant
    const { data: lobbyParticipations, error: lobbyError } = await supabase
      .from("lobby_participants")
      .select("lobby_id")
      .eq("user_id", userId)
      .eq("is_waiting", false); // Only include active participations

    if (lobbyError) throw lobbyError;

    // If user is part of any lobbies, fetch related bookings
    let lobbyBookings: any[] = [];
    if (lobbyParticipations && lobbyParticipations.length > 0) {
      const lobbyIds = lobbyParticipations.map((p) => p.lobby_id);

      const { data: bookingsFromLobbies, error: lobbyBookingsError } =
        await supabase
          .from("bookings")
          .select(
            `
          *,
          facility:facility_id(*)
        `
          )
          .in("lobby_id", lobbyIds)
          .order("date", { ascending: true });

      if (lobbyBookingsError) throw lobbyBookingsError;

      lobbyBookings = bookingsFromLobbies || [];
    }

    // Combine both types of bookings, removing duplicates
    const allBookings = [...(directBookings || [])];

    // Add lobby bookings that aren't already in the list (to avoid duplicates)
    lobbyBookings.forEach((lobbyBooking) => {
      if (!allBookings.some((b) => b.id === lobbyBooking.id)) {
        // Mark that this is a lobby booking the user participated in
        lobbyBooking.isLobbyParticipant = true;
        allBookings.push(lobbyBooking);
      }
    });

    // Ensure ordered by date and time
    allBookings.sort((a, b) => {
      // First compare by date
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;

      // If same date, compare by start time
      if (a.start_time < b.start_time) return -1;
      if (a.start_time > b.start_time) return 1;

      return 0;
    });

    return { data: allBookings, error: null };
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return { data: null, error };
  }
}

/**
 * Fetches a booking by ID with related facility data
 */
export async function getBookingById(id: string) {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        facility:facility_id(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching booking:", error);
    return { data: null, error };
  }
}

/**
 * Creates a new booking
 */
export async function createBooking(bookingData: {
  facility_id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  notes?: string;
  lobby_id?: string;
}) {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          ...bookingData,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error creating booking:", error);
    return { data: null, error };
  }
}

/**
 * Updates a booking's status
 */
export async function updateBookingStatus(id: string, status: BookingStatus) {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error updating booking status:", error);
    return { data: null, error };
  }
}

/**
 * Gets all bookings for a facility
 */
export async function getFacilityBookings(facilityId: string) {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("facility_id", facilityId)
      .order("date", { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching facility bookings:", error);
    return { data: null, error };
  }
}

/**
 * Fetches bookings for a date range
 */
export async function getBookingsForDateRange(
  startDate: string,
  endDate: string
) {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .in("status", ["confirmed", "pending"]);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching bookings for date range:", error);
    return { data: null, error };
  }
}
