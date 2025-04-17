// src/components/bookings/UserLobbiesList.tsx
import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/utils";
import { Lobby } from "@/types/lobby";
import { useRouter } from "next/navigation";

type UserLobbiesListProps = {
  lobbies: Lobby[];
};

/**
 * Component for displaying a user's lobbies in the bookings section
 */
export function UserLobbiesList({ lobbies }: UserLobbiesListProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle snake_case field names from the database
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "filled":
        return "bg-green-100 text-green-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!lobbies || lobbies.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No active lobbies found
        </h3>
        <p className="text-gray-500 mb-6">
          You are not currently part of any lobby groups.
        </p>
        <Link href="/discover">
          <Button>Find Lobbies</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lobbies.map((lobby) => (
        <Card key={lobby.id} className="overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between">
              {/* Lobby details */}
              <div className="mb-4 sm:mb-0">
                <div className="flex flex-wrap items-center mb-2 gap-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {formatDate(lobby.date)}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      lobby.status
                    )}`}
                  >
                    {lobby.status.charAt(0).toUpperCase() +
                      lobby.status.slice(1)}
                  </span>

                  {/* Show creator badge if user created this lobby */}
                  {lobby.isCreator && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Creator
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <p>
                    <span className="font-medium">Facility:</span>{" "}
                    {lobby.facility?.name || "Unknown Facility"}
                  </p>
                  <p>
                    <span className="font-medium">Time:</span>{" "}
                    {formatTime(lobby.start_time)} -{" "}
                    {formatTime(lobby.end_time)}
                  </p>
                  <p>
                    <span className="font-medium">Players:</span>{" "}
                    {lobby.current_players}/{lobby.min_players}
                    {lobby.current_players < lobby.min_players && (
                      <span className="text-gray-500">
                        {" "}
                        ({lobby.min_players - lobby.current_players} more
                        needed)
                      </span>
                    )}
                  </p>

                  {lobby.group_name && (
                    <p>
                      <span className="font-medium">Group:</span>{" "}
                      {lobby.group_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Lobby actions */}
              <div className="flex flex-col space-y-2">
                <Link href={`/lobbies/${lobby.id}`}>
                  <Button variant="primary" fullWidth size="sm">
                    View Details
                  </Button>
                </Link>

                <Link href={`/facilities/${lobby.facility_id}`}>
                  <Button variant="outline" fullWidth size="sm">
                    View Facility
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
