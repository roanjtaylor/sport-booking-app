// src/components/lobbies/LobbyList.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils";
import { Lobby } from "@/types/lobby";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { usersApi } from "@/lib/api";

type LobbyListProps = {
  lobbies: Lobby[];
  onJoinLobby?: (lobbyId: string) => Promise<void>;
  isLoading?: boolean;
  gridLayout?: boolean;
};

/**
 * Component for displaying a list of available lobbies for a facility
 */
export function LobbyList({
  lobbies,
  onJoinLobby,
  isLoading = false,
  gridLayout = false,
}: LobbyListProps) {
  const [userParticipations, setUserParticipations] = useState<{
    [lobbyId: string]: boolean;
  }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingParticipation, setIsCheckingParticipation] = useState(true);
  const [processedLobbies, setProcessedLobbies] = useState<Lobby[]>([]);
  const [userWaitingStatuses, setUserWaitingStatuses] = useState<{
    [lobbyId: string]: number | null;
  }>({});

  // Check if current user is a participant in any lobbies
  useEffect(() => {
    const checkUserParticipation = async () => {
      try {
        setIsCheckingParticipation(true);

        // Get current user from the auth API
        const { data: user, error: userError } =
          await usersApi.getCurrentUser();

        if (userError || !user) {
          setIsCheckingParticipation(false);
          setProcessedLobbies(lobbies);
          return;
        }

        setUserId(user.id);

        // Create maps to track participation
        const participationMap: { [lobbyId: string]: boolean } = {};
        const waitingStatusMap: { [lobbyId: string]: number | null } = {};

        // Check participation status for each lobby
        for (const lobby of lobbies) {
          const {
            isParticipant,
            isWaiting,
            waitingPosition,
            error: participationError,
          } = await usersApi.isLobbyParticipant(user.id, lobby.id);

          if (participationError) {
            console.error(
              "Error checking lobby participation:",
              participationError
            );
            continue;
          }

          // Store participation status
          if (isParticipant) {
            participationMap[lobby.id] = true;
          }

          // Store waiting list status
          if (isWaiting) {
            waitingStatusMap[lobby.id] = waitingPosition;
          }
        }

        setUserParticipations(participationMap);
        setUserWaitingStatuses(waitingStatusMap);
        setProcessedLobbies(lobbies);
      } catch (err) {
        console.error("Error checking user participation:", err);
        // Still show lobbies even if there's an error checking participation
        setProcessedLobbies(lobbies);
      } finally {
        setIsCheckingParticipation(false);
      }
    };

    checkUserParticipation();
  }, [lobbies]);

  // Function to check if user is in this lobby
  const isUserInLobby = (lobbyId: string) => {
    return userParticipations[lobbyId] || false;
  };

  // Check if user is on waiting list for this lobby
  const isUserWaiting = (lobbyId: string) => {
    return lobbyId in userWaitingStatuses;
  };

  // Get waiting position
  const getUserWaitingPosition = (lobbyId: string) => {
    return userWaitingStatuses[lobbyId] || null;
  };

  // Show a loading state while checking participation
  if (isCheckingParticipation) {
    return <LoadingIndicator message="Loading lobbies..." />;
  }

  // If no lobbies are found, display a message
  if (!processedLobbies || processedLobbies.length === 0) {
    return (
      <EmptyState
        title="No open lobbies found"
        message="Be the first to create a lobby for a facility!"
      />
    );
  }

  return (
    <div
      className={
        gridLayout ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"
      }
    >
      {processedLobbies.map((lobby) => (
        <Card
          key={lobby.id}
          className={`overflow-hidden ${
            gridLayout ? "h-full flex flex-col" : ""
          } ${isUserInLobby(lobby.id) ? "ring-2 ring-green-500" : ""}`}
        >
          {/* Card contents */}
          <div
            className={
              gridLayout ? "flex flex-col h-full" : "flex flex-col md:flex-row"
            }
          >
            {/* Facility image */}
            <div
              className={`bg-gray-200 h-48 relative ${
                gridLayout ? "w-full" : "md:w-1/3"
              }`}
            >
              {lobby.facility?.image_url ? (
                <img
                  src={lobby.facility.image_url}
                  alt={lobby.facility?.name || "Facility"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>

            {/* Lobby details */}
            <div className={`p-4 ${gridLayout ? "flex-grow" : "md:w-2/3"}`}>
              <div className="flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-900 mr-3">
                      {formatDate(lobby.date)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1">
                      <StatusBadge
                        status={`${lobby.current_players}/${lobby.min_players} Players`}
                        variant="info"
                      />

                      {/* Show waiting list count if any */}
                      {lobby.waiting_count > 0 && (
                        <StatusBadge
                          status={`+${lobby.waiting_count} waiting`}
                          variant="waiting"
                        />
                      )}

                      {/* Show status badge for lobby */}
                      <StatusBadge
                        status={
                          lobby.status.charAt(0).toUpperCase() +
                          lobby.status.slice(1)
                        }
                      />

                      {/* Show enrolled badge if user is in this lobby */}
                      {isUserInLobby(lobby.id) && (
                        <StatusBadge status="✓" variant="success" />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Facility:</span>{" "}
                    {lobby.facility?.name || "Unknown"}
                  </p>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <span className="font-medium">Time:</span>{" "}
                      {formatTime(lobby.start_time)} -{" "}
                      {formatTime(lobby.end_time)}
                    </p>
                  </div>

                  {/* Group name if available */}
                  {lobby.group_name && (
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      Group: {lobby.group_name}
                    </p>
                  )}

                  {/* Show initial group size info */}
                  {lobby.initial_group_size > 1 && (
                    <p className="text-sm text-gray-600 mb-2">
                      Started with {lobby.initial_group_size} players
                    </p>
                  )}
                </div>

                {/* Lobby actions */}
                <div
                  className={`flex space-x-2 ${gridLayout ? "mt-auto" : ""}`}
                >
                  {/* Show Join button only if:
                      1. onJoinLobby is provided
                      2. User is not already an active participant
                      3. User is not on the waiting list
                      4. Not already in process of joining */}
                  {onJoinLobby &&
                    !isUserInLobby(lobby.id) &&
                    !isUserWaiting(lobby.id) &&
                    !isLoading && (
                      <Button
                        onClick={() => onJoinLobby(lobby.id)}
                        disabled={isLoading}
                        size="sm"
                      >
                        {lobby.status === "filled" ||
                        lobby.current_players >= lobby.min_players
                          ? "Join Waiting List"
                          : "Join"}
                      </Button>
                    )}

                  {/* Show waiting list status if user is on waiting list */}
                  <Link href={`/lobbies/${lobby.id}`} className="flex-grow">
                    <Button variant="outline" fullWidth size="sm">
                      {isUserInLobby(lobby.id)
                        ? "View Your Lobby"
                        : isUserWaiting(lobby.id)
                        ? "View Waiting Status"
                        : "View Details"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
