// src/lib/api/lobbies.ts
import { supabase } from "@/lib/supabase";
import { Lobby, LobbyStatus } from "@/types/lobby";

/**
 * Fetches a lobby by ID with related data
 */
export async function getLobbyById(id: string) {
  try {
    // Get the lobby with facility and creator info
    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select(
        `
        *,
        facility:facility_id(*)
      `
      )
      .eq("id", id)
      .single();

    if (lobbyError) throw lobbyError;

    // Get the participants
    const { data: participants, error: participantsError } = await supabase
      .from("lobby_participants")
      .select(
        `
        *,
        user:user_id(*)
      `
      )
      .eq("lobby_id", id);

    if (participantsError) throw participantsError;

    return {
      data: {
        ...lobby,
        participants: participants || [],
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching lobby:", error);
    return { data: null, error };
  }
}

/**
 * Fetches all open lobbies
 */
export async function getOpenLobbies() {
  try {
    const { data, error } = await supabase
      .from("lobbies")
      .select(
        `
        *,
        facility:facility_id(*)
      `
      )
      .eq("status", "open")
      .order("date", { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching open lobbies:", error);
    return { data: null, error };
  }
}

/**
 * Fetches open lobbies for a specific facility
 */
export async function getFacilityLobbies(facilityId: string) {
  try {
    const { data, error } = await supabase
      .from("lobbies")
      .select(
        `
        *,
        facility:facility_id(*),
        creator:creator_id(*)
      `
      )
      .eq("facility_id", facilityId)
      .order("date", { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching facility lobbies:", error);
    return { data: null, error };
  }
}

/**
 * Fetches lobbies for a date range
 */
export async function getLobbiesForDateRange(
  startDate: string,
  endDate: string
) {
  try {
    const { data, error } = await supabase
      .from("lobbies")
      .select("*, facility:facility_id(*)")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching lobbies for date range:", error);
    return { data: null, error };
  }
}

/**
 * Creates a new lobby
 */
export async function createLobby(lobbyData: {
  facility_id: string;
  creator_id: string;
  creator_email: string;
  date: string;
  start_time: string;
  end_time: string;
  min_players: number;
  initial_group_size: number;
  group_name?: string;
  notes?: string;
}) {
  try {
    // Create the lobby with specified player count
    const { data, error } = await supabase
      .from("lobbies")
      .insert({
        facility_id: lobbyData.facility_id,
        creator_id: lobbyData.creator_id,
        creator_email: lobbyData.creator_email,
        date: lobbyData.date,
        start_time: lobbyData.start_time,
        end_time: lobbyData.end_time,
        min_players: lobbyData.min_players,
        current_players: lobbyData.initial_group_size, // Start with specified group size
        initial_group_size: lobbyData.initial_group_size,
        group_name: lobbyData.group_name || null,
        notes: lobbyData.notes || null,
        status:
          lobbyData.initial_group_size >= lobbyData.min_players
            ? "filled"
            : "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Add the creator as a participant
    const { error: participantError } = await supabase
      .from("lobby_participants")
      .insert({
        lobby_id: data.id,
        user_id: lobbyData.creator_id,
        participant_email: lobbyData.creator_email,
        joined_at: new Date().toISOString(),
        is_waiting: false,
      });

    if (participantError) throw participantError;

    return { data, error: null };
  } catch (error) {
    console.error("Error creating lobby:", error);
    return { data: null, error };
  }
}

/**
 * Join a lobby or join waiting list if full
 */
export async function joinLobby(
  lobbyId: string,
  userId: string,
  userEmail: string
) {
  try {
    // Get the lobby details first
    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select("*")
      .eq("id", lobbyId)
      .single();

    if (lobbyError) throw lobbyError;

    // Check if the user is already a participant
    const { data: existingParticipant, error: checkError } = await supabase
      .from("lobby_participants")
      .select("id")
      .eq("lobby_id", lobbyId)
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingParticipant) {
      throw new Error("You are already part of this lobby");
    }

    // Check if the lobby is already full
    const isFull =
      lobby.current_players >= lobby.min_players || lobby.status === "filled";

    // Add the user as a participant - with waiting status if lobby is full
    const { data: newParticipant, error: participantError } = await supabase
      .from("lobby_participants")
      .insert({
        lobby_id: lobbyId,
        user_id: userId,
        participant_email: userEmail,
        is_waiting: isFull,
        waiting_position: isFull ? (lobby.waiting_count || 0) + 1 : null,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (participantError) throw participantError;

    if (isFull) {
      // If joining the waiting list, increment waiting_count but not current_players
      const { error: updateError } = await supabase
        .from("lobbies")
        .update({
          waiting_count: (lobby.waiting_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lobbyId);

      if (updateError) throw updateError;

      return {
        success: true,
        isWaiting: true,
        waitingPosition: (lobby.waiting_count || 0) + 1,
        isFull: true,
        newCount: lobby.current_players, // unchanged for waiting list
      };
    } else {
      // Not joining waiting list - proceed with normal join logic
      const newCount = lobby.current_players + 1;
      const becomingFull = newCount >= lobby.min_players;

      // Update the lobby with the new count
      const { error: updateError } = await supabase
        .from("lobbies")
        .update({
          current_players: newCount,
          status: becomingFull ? "filled" : "open",
          updated_at: new Date().toISOString(),
        })
        .eq("id", lobbyId);

      if (updateError) throw updateError;

      // If the lobby is NOW becoming full, create a booking
      let bookingId = null;
      if (becomingFull && lobby.status !== "filled") {
        const { data: facility, error: facilityError } = await supabase
          .from("facilities")
          .select("price_per_hour")
          .eq("id", lobby.facility_id)
          .single();

        if (facilityError) throw facilityError;

        const { data: booking, error: bookingError } = await supabase
          .from("bookings")
          .insert({
            facility_id: lobby.facility_id,
            user_id: lobby.creator_id,
            date: lobby.date,
            start_time: lobby.start_time,
            end_time: lobby.end_time,
            status: "pending",
            total_price: facility.price_per_hour,
            notes: `Group booking from lobby: ${lobbyId}`,
            lobby_id: lobbyId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (bookingError) throw bookingError;
        bookingId = booking?.id;
      }

      return {
        success: true,
        bookingId,
        isFull: becomingFull,
        newCount,
        isWaiting: false,
      };
    }
  } catch (error) {
    console.error("Error joining lobby:", error);
    throw error;
  }
}

/**
 * Leave a lobby and promote next waiting person if needed
 */
export async function leaveLobby(lobbyId: string, userId: string) {
  try {
    // Get participant's current status and position
    const { data: participant, error: getError } = await supabase
      .from("lobby_participants")
      .select("is_waiting, waiting_position")
      .eq("lobby_id", lobbyId)
      .eq("user_id", userId)
      .single();

    if (getError) throw getError;

    // Remove the user from participants
    const { error: deleteError } = await supabase
      .from("lobby_participants")
      .delete()
      .eq("lobby_id", lobbyId)
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    // Get current lobby information
    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select("current_players, min_players, status, waiting_count")
      .eq("id", lobbyId)
      .single();

    if (lobbyError) throw lobbyError;

    // If active participant left (not on waiting list)
    if (!participant.is_waiting) {
      // Decrement current players
      let newCount = lobby.current_players - 1;

      // If there are people on the waiting list, promote the first one
      if (lobby.waiting_count > 0) {
        // Find next waiting person with explicit error handling
        const { data: nextPerson, error: nextPersonError } = await supabase
          .from("lobby_participants")
          .select("*") // Get all fields for better logging
          .eq("lobby_id", lobbyId)
          .eq("is_waiting", true)
          .eq("waiting_position", 1)
          .single();

        if (nextPersonError) {
          console.error("Error finding next person:", nextPersonError);
        } else if (nextPerson) {
          // Promote this person
          const { error: promoteError } = await supabase
            .from("lobby_participants")
            .update({ is_waiting: false, waiting_position: null })
            .eq("id", nextPerson.id);

          if (promoteError) {
            console.error(
              "Failed to promote waiting participant:",
              promoteError
            );
          } else {
            // Don't decrement current_players since we're replacing the person
            newCount = lobby.current_players;

            // Update waiting positions for everyone else
            const { error: shiftError } = await supabase.rpc(
              "shift_waiting_positions",
              {
                lobby_id: lobbyId,
              }
            );

            if (shiftError) {
              console.error("Error shifting waiting positions:", shiftError);
            }

            // Decrease waiting count
            const { error: updateError } = await supabase
              .from("lobbies")
              .update({
                waiting_count: Math.max(0, lobby.waiting_count - 1),
                updated_at: new Date().toISOString(),
              })
              .eq("id", lobbyId);

            if (updateError) {
              console.error("Error updating lobby waiting count:", updateError);
            }
          }
        }
      }

      // Always update player count
      const { error: playerCountError } = await supabase
        .from("lobbies")
        .update({
          current_players: newCount,
          status: newCount >= lobby.min_players ? "filled" : "open",
          updated_at: new Date().toISOString(),
        })
        .eq("id", lobbyId);

      if (playerCountError) {
        console.error("Error updating player count:", playerCountError);
      }
    } else {
      // Leaving from waiting list - get position first
      const waitingPosition = participant.waiting_position;

      if (!waitingPosition) {
        console.error("Participant marked as waiting but has no position");
      } else {
        // Update waiting positions for everyone behind this person
        const { error: reorderError } = await supabase.rpc(
          "reorder_waiting_positions",
          {
            p_lobby_id: lobbyId,
            p_left_position: waitingPosition,
          }
        );

        if (reorderError) {
          console.error("Error reordering waiting positions:", reorderError);
        }

        // Decrease waiting count on lobby
        const { error: updateError } = await supabase
          .from("lobbies")
          .update({
            waiting_count: Math.max(0, lobby.waiting_count - 1),
            updated_at: new Date().toISOString(),
          })
          .eq("id", lobbyId);

        if (updateError) {
          console.error("Error decreasing waiting count:", updateError);
        }
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in leaveLobby:", error);
    return { success: false, error };
  }
}

/**
 * Cancel a lobby (creator only)
 */
export async function cancelLobby(lobbyId: string, userId: string) {
  try {
    // Verify user is the creator
    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select("creator_id")
      .eq("id", lobbyId)
      .single();

    if (lobbyError) throw lobbyError;

    if (lobby.creator_id !== userId) {
      throw new Error("Only the lobby creator can cancel it");
    }

    // Update lobby status to cancelled
    const { data, error } = await supabase
      .from("lobbies")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", lobbyId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error cancelling lobby:", error);
    return { data: null, error };
  }
}

/**
 * Get user's active lobbies
 */
export async function getUserLobbies(userId: string) {
  try {
    // Get all lobby participation records for the user
    const { data: participations, error: participationsError } = await supabase
      .from("lobby_participants")
      .select("lobby_id")
      .eq("user_id", userId)
      .eq("is_waiting", false); // Only include active participations

    if (participationsError) throw participationsError;

    if (!participations || participations.length === 0) {
      return { data: [], error: null };
    }

    // Get all lobby IDs where the user is a participant
    const lobbyIds = participations.map((p) => p.lobby_id);

    // Fetch the lobby details with facility information
    const { data: userLobbies, error: lobbiesError } = await supabase
      .from("lobbies")
      .select(
        `
        *,
        facility:facility_id(*)
      `
      )
      .in("id", lobbyIds)
      .not("status", "in", '("cancelled", "expired")')
      .order("date", { ascending: true });

    if (lobbiesError) throw lobbiesError;

    // Add isCreator flag to each lobby
    const lobbiesWithCreatorInfo = (userLobbies || []).map((lobby) => ({
      ...lobby,
      isCreator: userId === lobby.creator_id,
    }));

    return { data: lobbiesWithCreatorInfo, error: null };
  } catch (error) {
    console.error("Error fetching user lobbies:", error);
    return { data: null, error };
  }
}

/**
 * Fetches lobbies with facilities that have coordinates
 */
export async function getLobbiesWithCoordinates() {
  try {
    const { data, error } = await supabase
      .from("lobbies")
      .select(
        `
        *,
        facility:facility_id(*)
      `
      )
      .eq("status", "open");

    if (error) throw error;

    // Filter to only include lobbies with facilities that have coordinates
    const lobbiesWithCoordinates = (data || []).filter(
      (lobby) =>
        lobby.facility && lobby.facility.latitude && lobby.facility.longitude
    );

    return { data: lobbiesWithCoordinates, error: null };
  } catch (error) {
    console.error("Error fetching lobbies with coordinates:", error);
    return { data: null, error };
  }
}

/**
 * Filter lobbies based on user criteria
 */
export async function filterLobbies(criteria: {
  search?: string;
  sportType?: string;
  dateRange?: string;
}) {
  try {
    // Get all open lobbies with facility information
    const { data: lobbies, error } = await getOpenLobbies();
    if (error) throw error;

    let filtered = [...(lobbies || [])];

    // Apply search filter
    if (criteria.search) {
      const searchLower = criteria.search.toLowerCase();
      filtered = filtered.filter(
        (lobby) =>
          lobby.facility?.name?.toLowerCase().includes(searchLower) ||
          lobby.facility?.address?.toLowerCase().includes(searchLower) ||
          lobby.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sport type filter
    if (criteria.sportType) {
      filtered = filtered.filter((lobby) =>
        lobby.facility?.sportType?.includes(criteria.sportType)
      );
    }

    // Apply date range filter
    if (criteria.dateRange) {
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      filtered = filtered.filter((lobby) => {
        if (criteria.dateRange === "today") {
          return lobby.date === today;
        } else if (criteria.dateRange === "tomorrow") {
          return lobby.date === tomorrowStr;
        } else if (criteria.dateRange === "week") {
          const lobbyDate = new Date(lobby.date);
          const weekFromNow = new Date();
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return lobbyDate <= weekFromNow;
        }
        return true;
      });
    }

    return { data: filtered, error: null };
  } catch (error) {
    console.error("Error filtering lobbies:", error);
    return { data: null, error };
  }
}
