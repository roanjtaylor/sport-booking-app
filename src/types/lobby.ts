// src/types/lobby.ts
import { User } from "@supabase/supabase-js";
import { Facility } from "./facility";
import { Booking } from "./booking";

/**
 * Status options for a lobby
 */
export type LobbyStatus = "open" | "filled" | "expired" | "cancelled";

/**
 * Represents a lobby for a partial booking
 */
export interface Lobby {
  id: string;
  facility_id: string;
  creator_id: string;
  creator_email: string;
  date: string;
  start_time: string; // 24-hour format (HH:MM)
  end_time: string; // 24-hour format (HH:MM)
  min_players: number;
  current_players: number;
  status: LobbyStatus;
  notes?: string;
  created_at: string;
  updated_at: string;

  // These are populated via joins
  facility?: Facility;
  creator?: User;
  participants?: LobbyParticipant[];
  booking?: Booking; // Reference to the booking created when the lobby is filled
}

/**
 * Represents a user participating in a lobby
 */
export interface LobbyParticipant {
  id: string;
  lobby_id: string;
  user_id: string;
  participant_email?: string;
  joined_at: string;

  // Populated via joins
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

/**
 * Response from joining a lobby
 */
export interface JoinLobbyResponse {
  lobby: Lobby;
  bookingId?: string; // Will be present if the lobby was filled and a booking was created
}
