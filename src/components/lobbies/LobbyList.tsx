// src/components/lobbies/LobbyList.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate, formatTime } from "@/lib/utils";
import { Lobby } from "@/types/lobby";
import { supabase } from "@/lib/supabase";

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

  // Check if current user is a participant in any lobbies
  useEffect(() => {
    const checkUserParticipation = async () => {
      try {
        setIsCheckingParticipation(true);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsCheckingParticipation(false);
          setProcessedLobbies(lobbies);
          return;
        }

        setUserId(user.id);

        // Get all lobbies the user is part of
        const { data: participations } = await supabase
          .from("lobby_participants")
          .select("lobby_id")
          .eq("user_id", user.id);

        // Create map of lobby IDs to participation status
        const participationMap: { [lobbyId: string]: boolean } = {};

        if (participations) {
          participations.forEach((p) => {
            participationMap[p.lobby_id] = true;
          });
        }

        setUserParticipations(participationMap);
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

  // Handle snake_case field names from the database
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-800";
      case "filled":
        return "bg-green-100 text-green-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Show a loading state while checking participation
  if (isCheckingParticipation) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div
              className={
                gridLayout
                  ? "flex flex-col h-full"
                  : "flex flex-col md:flex-row"
              }
            >
              <div
                className={`bg-gray-200 h-48 relative ${
                  gridLayout ? "w-full" : "md:w-1/3"
                }`}
              ></div>
              <div className={`p-4 ${gridLayout ? "flex-grow" : "md:w-2/3"}`}>
                <div className="h-6 bg-gray-200 rounded mb-3 w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // If no lobbies are found, display a message
  if (!processedLobbies || processedLobbies.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No open lobbies found
        </h3>
        <p className="text-gray-500 mb-6">
          Be the first to create a lobby for a facility!
        </p>
      </div>
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {lobby.current_players}/{lobby.min_players} Players
                      </span>

                      {/* Show waiting list count if any */}
                      {lobby.waiting_count > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          +{lobby.waiting_count} waiting
                        </span>
                      )}

                      {/* Show status badge for lobby */}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          lobby.status
                        )}`}
                      >
                        {lobby.status.charAt(0).toUpperCase() +
                          lobby.status.slice(1)}
                      </span>

                      {/* Show enrolled badge if user is in this lobby */}
                      {isUserInLobby(lobby.id) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓
                        </span>
                      )}
                    </div>
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
                </div>

                {/* Lobby actions */}
                <div
                  className={`flex space-x-2 ${gridLayout ? "mt-auto" : ""}`}
                >
                  {/* Show Join button only if not already in the lobby */}
                  {onJoinLobby && !isUserInLobby(lobby.id) && (
                    <Button
                      onClick={() => onJoinLobby(lobby.id)}
                      disabled={isLoading}
                      size="sm"
                    >
                      {lobby.current_players >= lobby.min_players
                        ? "Join Waiting List"
                        : "Join"}
                    </Button>
                  )}

                  <Link href={`/lobbies/${lobby.id}`} className="flex-grow">
                    <Button variant="outline" fullWidth size="sm">
                      {isUserInLobby(lobby.id)
                        ? "View Your Lobby"
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
