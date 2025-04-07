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
    .eq("status", "open")
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
  >
) {
  // Create the lobby
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
      current_players: 1, // Start with the creator
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
    });

  if (participantError) throw participantError;

  return data as Lobby;
}

/**
 * Join an existing lobby
 */
export async function joinLobby(lobbyId: string, userId: string) {
  // Add the user as a participant
  const { error: participantError } = await supabase
    .from("lobby_participants")
    .insert({
      lobby_id: lobbyId,
      user_id: userId,
    });

  if (participantError) throw participantError;

  // Get lobby details and participant count
  const { data: participants, error: countError } = await supabase
    .from("lobby_participants")
    .select("id")
    .eq("lobby_id", lobbyId);

  if (countError) throw countError;

  // Get the lobby details
  const { data: lobby, error: lobbyError } = await supabase
    .from("lobbies")
    .select("*")
    .eq("id", lobbyId)
    .single();

  if (lobbyError) throw lobbyError;

  const newPlayerCount = participants?.length || 0;
  let bookingId = null;

  // Update lobby with new participant count
  const updateData: any = {
    current_players: newPlayerCount,
    updated_at: new Date().toISOString(),
  };

  // Check if the lobby is now filled
  if (newPlayerCount >= lobby.min_players) {
    updateData.status = "filled";

    // Fetch facility data for pricing
    const { data: facility, error: facilityError } = await supabase
      .from("facilities")
      .select("price_per_hour")
      .eq("id", lobby.facility_id)
      .single();

    if (facilityError) throw facilityError;

    // Create a booking from this lobby
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        facility_id: lobby.facility_id,
        user_id: lobby.creator_id, // Creator is responsible for the booking
        date: lobby.date,
        start_time: lobby.start_time,
        end_time: lobby.end_time,
        status: "pending",
        total_price: facility.price_per_hour,
        notes: `Group booking from lobby ${lobbyId} - ${newPlayerCount} players`,
        lobby_id: lobbyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    if (bookingData) {
      bookingId = bookingData.id;
    }
  }

  // Update the lobby
  const { error: updateError } = await supabase
    .from("lobbies")
    .update(updateData)
    .eq("id", lobbyId);

  if (updateError) throw updateError;

  // Return updated lobby and booking ID if created
  return {
    lobby: {
      ...lobby,
      current_players: newPlayerCount,
      status: newPlayerCount >= lobby.min_players ? "filled" : "open",
    },
    bookingId,
  };
}

/**
 * Leave a lobby
 */
export async function leaveLobby(lobbyId: string, userId: string) {
  // Remove the user from participants
  const { error: deleteError } = await supabase
    .from("lobby_participants")
    .delete()
    .eq("lobby_id", lobbyId)
    .eq("user_id", userId);

  if (deleteError) throw deleteError;

  // Get updated participant count
  const { data: participants, error: countError } = await supabase
    .from("lobby_participants")
    .select("id")
    .eq("lobby_id", lobbyId);

  if (countError) throw countError;

  // Update the lobby with the new count
  const { data, error } = await supabase
    .from("lobbies")
    .update({
      current_players: participants?.length || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lobbyId)
    .select()
    .single();

  if (error) throw error;

  return data as Lobby;
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
