// src/components/lobbies/LobbyList.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate, formatTime } from "@/lib/utils";
import { Lobby } from "@/types/lobby";

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
  // If no lobbies are found, display a message
  if (!lobbies || lobbies.length === 0) {
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

  // Handle snake_case field names from the database
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-800";
      case "filled":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={
        gridLayout ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"
      }
    >
      {lobbies.map((lobby) => (
        <Card
          key={lobby.id}
          className={`overflow-hidden ${
            gridLayout ? "h-full flex flex-col" : ""
          }`}
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
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {lobby.current_players}/{lobby.min_players} Players
                      </span>

                      {/* Show waiting list count if any */}
                      {lobby.waiting_count > 0 && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          +{lobby.waiting_count} waiting
                        </span>
                      )}

                      {/* Show status badge for lobby */}
                      <span
                        className={`inline-flex items-center mx-2.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          lobby.status
                        )}`}
                      >
                        {lobby.status.charAt(0).toUpperCase() +
                          lobby.status.slice(1)}
                      </span>
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
                  {onJoinLobby && (
                    <Button
                      onClick={() => onJoinLobby(lobby.id)}
                      disabled={isLoading}
                      size="sm"
                    >
                      {lobby.current_players >= lobby.min_players
                        ? "Join Waitlist"
                        : "Join"}
                    </Button>
                  )}

                  <Link href={`/lobbies/${lobby.id}`} className="flex-grow">
                    <Button variant="outline" fullWidth size="sm">
                      View Details
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
