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

  initial_group_size: number; // Number of players already committed
  waiting_count: number; // Number of users on waiting list
  group_name?: string; // Optional name for the group

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
  is_waiting: boolean; // Whether participant is on waiting list
  waiting_position?: number; // Position in waiting list (if applicable)

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
