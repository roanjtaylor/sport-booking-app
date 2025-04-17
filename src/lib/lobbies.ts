// src/lib/lobbies.ts
import { supabase } from "./supabase";
import { Lobby, LobbyParticipant } from "@/types/lobby";

/**
 * Fetches open lobbies for a specific facility
 */
export async function getOpenLobbiesByFacility(facilityId: string) {
  const { data, error } = await supabase
    .from("lobbies")
    .select(
      `
      *,
      facility:facilities(*),
      creator:creator_id(*)
    `
    )
    .eq("facility_id", facilityId)
    .order("date", { ascending: true });

  if (error) throw error;
  return data as Lobby[];
}

/**
 * Creates a new lobby
 */
export async function createLobby(
  lobby: Omit<
    Lobby,
    "id" | "current_players" | "status" | "created_at" | "updated_at"
  >,
  initialGroupSize: number = 1
) {
  // Create the lobby with specified player count
  const { data, error } = await supabase
    .from("lobbies")
    .insert({
      facility_id: lobby.facility_id,
      creator_id: lobby.creator_id,
      date: lobby.date,
      start_time: lobby.start_time,
      end_time: lobby.end_time,
      min_players: lobby.min_players,
      notes: lobby.notes,
      current_players: initialGroupSize, // Start with specified group size
      initial_group_size: initialGroupSize,
      group_name: lobby.group_name || null,
      status: "open",
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
      user_id: lobby.creator_id,
      is_waiting: false,
    });

  if (participantError) throw participantError;

  return data as Lobby;
}

/**
 * Join an existing lobby or join waiting list if full
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
    const isFull = lobby.current_players >= lobby.min_players;

    // Add the user as a participant - with waiting status if lobby is full
    const { data: newParticipant, error: participantError } = await supabase
      .from("lobby_participants")
      .insert({
        lobby_id: lobbyId,
        user_id: userId,
        participant_email: userEmail,
        is_waiting: isFull,
        waiting_position: isFull ? (lobby.waiting_count || 0) + 1 : null,
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

      if (updateError) {
        console.error("Error updating lobby waiting count:", updateError);
        throw updateError;
      }

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
        // <-- FIXED: using becomingFull instead of isFull
        // First fetch the facility to get the price_per_hour
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
            total_price: facility.price_per_hour, // Use facility price
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
  const { data: participant, error: getError } = await supabase
    .from("lobby_participants")
    .select("is_waiting")
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

  // If active participant left and lobby was filled, promote next waiting person
  if (!participant.is_waiting) {
    const { data: lobby } = await supabase
      .from("lobbies")
      .select("current_players, min_players, status, waiting_count")
      .eq("id", lobbyId)
      .single();

    // Decrement current players
    let newCount = lobby.current_players - 1;

    // Check if we need to promote someone from waiting list
    if (lobby.status === "filled" && lobby.waiting_count > 0) {
      // Find next waiting person
      const { data: nextPerson } = await supabase
        .from("lobby_participants")
        .select("user_id")
        .eq("lobby_id", lobbyId)
        .eq("is_waiting", true)
        .eq("waiting_position", 1)
        .single();

      if (nextPerson) {
        // Promote this person
        await supabase
          .from("lobby_participants")
          .update({ is_waiting: false, waiting_position: null })
          .eq("lobby_id", lobbyId)
          .eq("user_id", nextPerson.user_id);

        // Don't decrement current_players since we're replacing the person
        newCount = lobby.current_players;

        // Update waiting positions for everyone else
        await supabase.rpc("shift_waiting_positions", { lobby_id: lobbyId });

        // Decrease waiting count
        await supabase
          .from("lobbies")
          .update({
            waiting_count: Math.max(0, lobby.waiting_count - 1),
            updated_at: new Date().toISOString(),
          })
          .eq("id", lobbyId);
      }
    } else {
      // Just update player count
      await supabase
        .from("lobbies")
        .update({
          current_players: newCount,
          status: newCount >= lobby.min_players ? "filled" : "open",
          updated_at: new Date().toISOString(),
        })
        .eq("id", lobbyId);
    }
  } else {
    // Leaving from waiting list
    // Decrease waiting count on lobby
    await supabase
      .from("lobbies")
      .update({
        waiting_count: supabase.rpc("decrement_waiting_count", {
          lobby_id: lobbyId,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", lobbyId);

    // Update waiting positions for everyone behind this person
    await supabase.rpc("reorder_waiting_positions", {
      p_lobby_id: lobbyId,
      p_left_position: participant.waiting_position,
    });
  }

  return { success: true };
}

/**
 * Helper function to create a booking when a lobby is filled
 */
async function createBookingFromFilledLobby(lobby) {
  // Get facility price info
  const { data: facility } = await supabase
    .from("facilities")
    .select("price_per_hour")
    .eq("id", lobby.facility_id)
    .single();

  // Create booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      facility_id: lobby.facility_id,
      user_id: lobby.creator_id,
      date: lobby.date,
      start_time: lobby.start_time,
      end_time: lobby.end_time,
      status: "pending",
      total_price: facility.price_per_hour,
      notes: `Group booking from lobby: ${lobby.id}`,
      lobby_id: lobby.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return booking.id;
}

/**
 * Cancel a lobby (creator only)
 */
export async function cancelLobby(lobbyId: string, userId: string) {
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

  return data as Lobby;
}

/**
 * Get lobby details with participants
 */
export async function getLobbyDetails(lobbyId: string) {
  // Get the lobby with facility and creator info
  const { data: lobby, error: lobbyError } = await supabase
    .from("lobbies")
    .select(
      `
      *,
      facility:facilities(*),
      creator:creator_id(*)
    `
    )
    .eq("id", lobbyId)
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
    .eq("lobby_id", lobbyId);

  if (participantsError) throw participantsError;

  return {
    ...lobby,
    participants: participants || [],
  } as Lobby;
}
