// src/lib/api/users.ts
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/types/user";

/**
 * Get a user profile by ID
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { data: null, error };
  }
}

/**
 * Get user role
 */
export async function getUserRole(userId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return { role: data?.role as UserRole, error: null };
  } catch (error) {
    console.error("Error fetching user role:", error);
    return { role: null, error };
  }
}

/**
 * Update a user profile
 */
export async function updateUserProfile(
  userId: string,
  profileData: { name?: string }
) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { data: null, error };
  }
}

/**
 * Check if a user is a facility owner for a specific facility
 */
export async function isFacilityOwner(userId: string, facilityId: string) {
  try {
    const { data, error } = await supabase
      .from("facilities")
      .select("id")
      .eq("owner_id", userId)
      .eq("id", facilityId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the error code for "no rows returned"
      throw error;
    }

    return { isOwner: !!data, error: null };
  } catch (error) {
    console.error("Error checking facility ownership:", error);
    return { isOwner: false, error };
  }
}

/**
 * Get participants for a lobby
 */
export async function getLobbyParticipants(lobbyId: string) {
  try {
    const { data, error } = await supabase
      .from("lobby_participants")
      .select("*")
      .eq("lobby_id", lobbyId);

    if (error) throw error;

    // Then fetch profile data for each participant
    const participantsWithProfiles = await Promise.all(
      (data || []).map(async (participant) => {
        // Get profile data for this user_id
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", participant.user_id)
          .single();

        return {
          ...participant,
          user: profileError ? null : profileData,
        };
      })
    );

    return { data: participantsWithProfiles, error: null };
  } catch (error) {
    console.error("Error fetching lobby participants:", error);
    return { data: null, error };
  }
}

/**
 * Check if a user is participating in a lobby
 */
export async function isLobbyParticipant(userId: string, lobbyId: string) {
  try {
    // Check if the user is part of this lobby
    const { data, error } = await supabase
      .from("lobby_participants")
      .select("is_waiting, waiting_position")
      .eq("lobby_id", lobbyId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return {
        isParticipant: false,
        isWaiting: false,
        waitingPosition: null,
        error: null,
      };
    }

    return {
      isParticipant: !data.is_waiting,
      isWaiting: !!data.is_waiting,
      waitingPosition: data.waiting_position,
      error: null,
    };
  } catch (error) {
    console.error("Error checking lobby participation:", error);
    return {
      isParticipant: false,
      isWaiting: false,
      waitingPosition: null,
      error,
    };
  }
}

/**
 * Get booking stats for a user dashboard
 */
export async function getUserBookingStats(userId: string) {
  try {
    // Get total bookings count
    const { count: totalCount, error: totalError } = await supabase
      .from("bookings")
      .select("id", { count: "exact" })
      .eq("user_id", userId);

    if (totalError) throw totalError;

    // Get upcoming bookings count
    const today = new Date().toISOString().split("T")[0];
    const { count: upcomingCount, error: upcomingError } = await supabase
      .from("bookings")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .gte("date", today)
      .not("status", "eq", "cancelled");

    if (upcomingError) throw upcomingError;

    return {
      data: {
        totalBookings: totalCount || 0,
        upcomingBookings: upcomingCount || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching user booking stats:", error);
    return { data: null, error };
  }
}

/**
 * Get facility owner stats for dashboard
 */
export async function getFacilityOwnerStats(userId: string) {
  try {
    // Get facilities count
    const { count: facilitiesCount, error: facilitiesError } = await supabase
      .from("facilities")
      .select("id", { count: "exact" })
      .eq("owner_id", userId);

    if (facilitiesError) throw facilitiesError;

    // Get facility IDs
    const { data: facilities, error: facilityListError } = await supabase
      .from("facilities")
      .select("id")
      .eq("owner_id", userId);

    if (facilityListError) throw facilityListError;

    const facilityIds = (facilities || []).map((f) => f.id);

    // If there are no facilities, return early
    if (facilityIds.length === 0) {
      return {
        data: {
          facilities: 0,
          totalBookings: 0,
          upcomingBookings: 0,
          pendingRequests: 0,
        },
        error: null,
      };
    }

    // Get total bookings count
    const { count: totalBookings, error: totalError } = await supabase
      .from("bookings")
      .select("id", { count: "exact" })
      .in("facility_id", facilityIds);

    if (totalError) throw totalError;

    // Get upcoming bookings count
    const today = new Date().toISOString().split("T")[0];
    const { count: upcomingBookings, error: upcomingError } = await supabase
      .from("bookings")
      .select("id", { count: "exact" })
      .in("facility_id", facilityIds)
      .gte("date", today)
      .eq("status", "confirmed");

    if (upcomingError) throw upcomingError;

    // Get pending requests count
    const { count: pendingRequests, error: pendingError } = await supabase
      .from("bookings")
      .select("id", { count: "exact" })
      .in("facility_id", facilityIds)
      .eq("status", "pending");

    if (pendingError) throw pendingError;

    return {
      data: {
        facilities: facilitiesCount || 0,
        totalBookings: totalBookings || 0,
        upcomingBookings: upcomingBookings || 0,
        pendingRequests: pendingRequests || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching facility owner stats:", error);
    return { data: null, error };
  }
}
