// src/lib/types/lobby-operations.ts
import { Lobby } from "@/types/lobby";

/**
 * Response from joining a lobby
 */
export interface JoinLobbyResponse {
  lobby: Lobby;
  bookingId: string | null; // Present if a booking was created
}

/**
 * Response from creating a lobby
 */
export interface CreateLobbyResponse {
  lobby: Lobby;
}

/**
 * Response from leaving a lobby
 */
export interface LeaveLobbyResponse {
  success: boolean;
}

/**
 * Response from cancelling a lobby
 */
export interface CancelLobbyResponse {
  success: boolean;
}
