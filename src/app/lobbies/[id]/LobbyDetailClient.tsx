// src/app/lobbies/[id]/LobbyDetailClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Lobby, LobbyParticipant } from "@/types/lobby";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { authApi, lobbiesApi, usersApi } from "@/lib/api";

type LobbyDetailClientProps = {
  lobby: Lobby;
};

/**
 * Client component for handling lobby detail interactions
 */
export default function LobbyDetailClient({ lobby }: LobbyDetailClientProps) {
  const router = useRouter();

  // State variables
  const [isCreator, setIsCreator] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Separate active and waiting participants from initial lobby data
  const initialActiveParticipants = (lobby.participants || []).filter(
    (p) => !p.is_waiting
  );
  const initialWaitingList = (lobby.participants || []).filter(
    (p) => p.is_waiting
  );

  // Sort waiting list by position
  initialWaitingList.sort(
    (a, b) => (a.waiting_position || 0) - (b.waiting_position || 0)
  );

  // Initialize state with correctly separated participants
  const [currentLobby, setCurrentLobby] = useState<Lobby>({
    ...lobby,
    participants: initialActiveParticipants,
  });
  const [waitingList, setWaitingList] =
    useState<LobbyParticipant[]>(initialWaitingList);

  const [isWaiting, setIsWaiting] = useState(false);
  const [waitingPosition, setWaitingPosition] = useState<number | null>(null);

  // Check if user is authenticated, creator, or participant and fetch lobby data
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Get current user using API layer
        const { data: user, error: userError } = await authApi.getCurrentUser();

        if (userError) {
          console.error("Error getting current user:", userError);
          setIsLoading(false);
          return;
        }

        if (user) {
          setUserId(user.id);
          setUserEmail(user.email ?? null);
          setIsCreator(user.id === lobby.creator_id);

          // Fetch full lobby details including waiting list
          await fetchLobbyData(user.id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error checking user status:", err);
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [lobby]);

  useEffect(() => {
    if (userId && currentLobby) {
      // Reset participation flags
      let foundAsParticipant = false;
      let foundAsWaiting = false;
      let position = null;

      // Check in active participants
      currentLobby.participants?.forEach((participant) => {
        if (participant.user_id === userId) {
          foundAsParticipant = true;
        }
      });

      // Check in waiting list
      waitingList.forEach((participant) => {
        if (participant.user_id === userId) {
          foundAsWaiting = true;
          position = participant.waiting_position;
        }
      });

      // Update state
      setIsParticipant(foundAsParticipant);
      setIsWaiting(foundAsWaiting);
      setWaitingPosition(position);
    }
  }, [currentLobby, waitingList, userId]);

  // Fetch complete lobby data including waiting list
  const fetchLobbyData = async (currentUserId: string) => {
    try {
      // Use API layer to get lobby details
      const { data: freshLobbyData, error: lobbyError } =
        await lobbiesApi.getLobbyById(lobby.id);

      if (lobbyError) {
        console.error("Error fetching lobby:", lobbyError);
        setIsLoading(false);
        return;
      }

      if (!freshLobbyData) {
        console.error("No lobby data returned");
        setIsLoading(false);
        return;
      }

      // Use API layer to check user participation status
      const {
        isParticipant: isActive,
        isWaiting: isOnWaitlist,
        waitingPosition: position,
        error: participationError,
      } = await usersApi.isLobbyParticipant(currentUserId, lobby.id);

      if (participationError) {
        console.error("Error checking participation:", participationError);
      } else {
        setIsParticipant(isActive);
        setIsWaiting(isOnWaitlist);
        setWaitingPosition(position);
      }

      // Get participants info using API layer
      const { data: participants, error: participantsError } =
        await usersApi.getLobbyParticipants(lobby.id);

      if (participantsError) {
        console.error("Error fetching participants:", participantsError);
      }

      if (participants) {
        // Separate active participants from waiting list
        const activeParticipants: LobbyParticipant[] = [];
        const waitingParticipants: LobbyParticipant[] = [];

        participants.forEach((participant) => {
          if (participant.is_waiting) {
            waitingParticipants.push(participant);
          } else {
            activeParticipants.push(participant);
          }
        });

        // Sort waiting list by position
        waitingParticipants.sort(
          (a, b) => (a.waiting_position || 0) - (b.waiting_position || 0)
        );

        setWaitingList(waitingParticipants);
        setCurrentLobby({
          ...freshLobbyData,
          participants: activeParticipants,
        });
      }
    } catch (err) {
      console.error("Error fetching lobby data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle joining the lobby
  const handleJoinLobby = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      if (!userId) {
        router.push(`/auth/login?redirect=/lobbies/${lobby.id}`);
        return;
      }

      // Check if the user is already a participant or waiting
      if (isParticipant || isWaiting) {
        setError("You are already in this lobby");
        return;
      }

      // Use the API layer to join the lobby
      const email = userEmail || "";
      const result = await lobbiesApi.joinLobby(lobby.id, userId, email);

      // Update local state to reflect changes immediately
      setCurrentLobby((prev) => ({
        ...prev,
        current_players: result.newCount,
        status: result.isFull ? "filled" : "open",
      }));

      // Handle waiting list join
      if (result.isWaiting) {
        setIsWaiting(true);
        setWaitingPosition(result.waitingPosition);

        // Update waiting count in the lobby display
        setCurrentLobby((prev) => ({
          ...prev,
          waiting_count: (prev.waiting_count || 0) + 1,
        }));

        // Add user to waiting list UI temporarily until refresh
        const updatedWaitingList = [
          ...waitingList,
          {
            id: "temp-" + Date.now(),
            user_id: userId,
            lobby_id: lobby.id,
            participant_email: email,
            is_waiting: true,
            waiting_position: result.waitingPosition,
            joined_at: new Date().toISOString(),
          },
        ];

        // Sort by waiting position
        updatedWaitingList.sort(
          (a, b) => (a.waiting_position || 0) - (b.waiting_position || 0)
        );
        setWaitingList(updatedWaitingList);
      } else {
        // Set the user as active participant in local state
        setIsParticipant(true);
        setIsWaiting(false);
      }

      // Refresh the lobby data
      fetchLobbyData(userId);
    } catch (err: any) {
      console.error("Error joining lobby:", err);
      setError(err.message || "Failed to join lobby");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle leaving the lobby
  const handleLeaveLobby = async () => {
    try {
      if (!confirm("Are you sure you want to leave this lobby?")) {
        return;
      }

      setIsProcessing(true);
      setError(null);

      if (!userId) {
        router.push(`/auth/login?redirect=/lobbies/${lobby.id}`);
        return;
      }

      // Use API layer to leave the lobby
      const { success, error: leaveError } = await lobbiesApi.leaveLobby(
        lobby.id,
        userId
      );

      if (leaveError) {
        throw leaveError;
      }

      // Update client state
      setIsParticipant(false);
      setIsWaiting(false);
      setWaitingPosition(null);

      // Refresh lobby data
      await fetchLobbyData(userId);
      alert("You have left the lobby successfully");
      router.refresh();
    } catch (err) {
      console.error("Error leaving lobby:", err);
      setError(err instanceof Error ? err.message : "Failed to leave lobby");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancelling the lobby (for creators only)
  const handleCancelLobby = async () => {
    try {
      if (
        !confirm(
          "Are you sure you want to cancel this lobby? This cannot be undone."
        )
      ) {
        return;
      }

      setIsProcessing(true);
      setError(null);

      if (!userId || !isCreator) {
        setError("You must be the creator to cancel this lobby");
        return;
      }

      // Use API layer to cancel the lobby
      const { data, error: cancelError } = await lobbiesApi.cancelLobby(
        lobby.id,
        userId
      );

      if (cancelError) {
        throw cancelError;
      }

      // Update local state
      setCurrentLobby({
        ...currentLobby,
        status: "cancelled",
      });

      // Refresh the page
      router.refresh();
    } catch (err: any) {
      console.error("Error cancelling lobby:", err);
      setError(err.message || "Failed to cancel lobby");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading lobby details..." />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <EmptyState
          title="Error"
          message={error}
          variant="compact"
          className="mb-2"
        />
        <div className="flex justify-center">
          <Button onClick={() => setError(null)}>Dismiss</Button>
        </div>
      </Card>
    );
  }

  // Format the status for display
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

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Lobby Details</h3>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                currentLobby.status
              )}`}
            >
              {currentLobby.status.charAt(0).toUpperCase() +
                currentLobby.status.slice(1)}
            </span>

            {/* Show waiting count if any */}
            {currentLobby.waiting_count > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                +{currentLobby.waiting_count} waiting
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Display waiting status for current user if applicable */}
      {isWaiting && (
        <div className="px-4 py-3 bg-yellow-50 text-yellow-700 border-b border-yellow-100">
          <div className="flex justify-between items-center">
            <p className="text-sm">
              You're on the waiting list (Position {waitingPosition})
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveLobby}
              disabled={isProcessing}
            >
              Leave Waiting List
            </Button>
          </div>
        </div>
      )}

      {/* Rest of the component remains the same - just the lobby details UI */}
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lobby information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Lobby Information
            </h4>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Date</dt>
                <dd className="mt-1 text-gray-900">
                  {formatDate(currentLobby.date)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Time</dt>
                <dd className="mt-1 text-gray-900">
                  {formatTime(currentLobby.start_time)} -{" "}
                  {formatTime(currentLobby.end_time)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Players</dt>
                <dd className="mt-1 text-gray-900">
                  {currentLobby.current_players} / {currentLobby.min_players}
                  {currentLobby.current_players < currentLobby.min_players && (
                    <span className="text-gray-500 ml-1">
                      ({currentLobby.min_players - currentLobby.current_players}{" "}
                      more needed)
                    </span>
                  )}
                </dd>
              </div>
              {currentLobby.initial_group_size &&
                currentLobby.initial_group_size > 1 && (
                  <div>
                    <dt className="text-gray-500">Initial Group Size</dt>
                    <dd className="mt-1 text-gray-900">
                      {currentLobby.initial_group_size} players
                    </dd>
                  </div>
                )}
              {currentLobby.group_name && (
                <div>
                  <dt className="text-gray-500">Group Name</dt>
                  <dd className="mt-1 text-gray-900">
                    {currentLobby.group_name}
                  </dd>
                </div>
              )}
              {currentLobby.notes && (
                <div>
                  <dt className="text-gray-500">Notes</dt>
                  <dd className="mt-1 text-gray-900">{currentLobby.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Created By</dt>
                <dd className="mt-1 text-gray-900">
                  {currentLobby.creator_email ||
                    currentLobby.creator?.email ||
                    "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Created At</dt>
                <dd className="mt-1 text-gray-900">
                  {formatDate(currentLobby.created_at)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Facility information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Facility Information
            </h4>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="mt-1 text-gray-900">
                  {currentLobby.facility?.name || "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="mt-1 text-gray-900">
                  {currentLobby.facility ? (
                    <>
                      {currentLobby.facility.address},{" "}
                      {currentLobby.facility.city},{" "}
                      {currentLobby.facility.postal_code}
                    </>
                  ) : (
                    "Unknown"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Price Per Hour</dt>
                <dd className="mt-1 text-gray-900">
                  {currentLobby.facility
                    ? formatPrice(
                        currentLobby.facility.price_per_hour,
                        currentLobby.facility.currency
                      )
                    : "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Game Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {currentLobby.facility?.sportType
                    ? currentLobby.facility.sportType.map((sport: string) => (
                        <span
                          key={sport}
                          className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                        >
                          {sport.charAt(0).toUpperCase() + sport.slice(1)}
                        </span>
                      ))
                    : currentLobby.facility?.sport_type?.map(
                        (sport: string) => (
                          <span
                            key={sport}
                            className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                          >
                            {sport.charAt(0).toUpperCase() + sport.slice(1)}
                          </span>
                        )
                      )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Participants section */}
        <div className="mt-8">
          <h4 className="font-medium text-gray-900 mb-3">
            Participants ({currentLobby.current_players}/
            {currentLobby.min_players})
          </h4>
          <div className="bg-gray-50 rounded-md p-4">
            {currentLobby.participants &&
            currentLobby.participants.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {currentLobby.participants.map((participant) => (
                  <li
                    key={participant.id}
                    className="py-2 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                        {(participant.participant_email ||
                          participant.user?.email ||
                          "Unknown")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {participant.participant_email ||
                            participant.user?.email ||
                            "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {participant.user_id === currentLobby.creator_id
                            ? "Creator"
                            : "Participant"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Joined {formatDate(participant.joined_at, "PPp")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-2">
                No participants yet
              </p>
            )}
          </div>
        </div>

        {/* Waiting list section - Always show if there's a waiting list */}
        {waitingList.length > 0 && (
          <div className="mt-8">
            <h4 className="font-medium text-gray-900 mb-3">
              Waiting List ({waitingList.length})
            </h4>
            <div className="bg-yellow-50 rounded-md p-4 border border-yellow-100">
              <ul className="divide-y divide-yellow-200">
                {waitingList.map((participant) => (
                  <li
                    key={participant.id}
                    className="py-2 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mr-3">
                        {participant.waiting_position}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {participant.participant_email ||
                            participant.user?.email ||
                            "Unknown User"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Joined {formatDate(participant.joined_at, "PPp")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <Link href={`/facilities/${currentLobby.facility_id}`}>
            <Button variant="secondary">Back to Facility</Button>
          </Link>

          {/* Show Join button only if lobby is open and user is not already a participant or waiting */}
          {(currentLobby.status === "open" ||
            currentLobby.status === "filled") &&
            !isParticipant &&
            !isWaiting && (
              <Button onClick={handleJoinLobby} disabled={isProcessing}>
                {currentLobby.status === "filled" ||
                currentLobby.current_players >= currentLobby.min_players
                  ? "Join Waiting List"
                  : "Join Lobby"}
              </Button>
            )}

          {/* Show Leave button for participants who are not the creator */}
          {(isParticipant || isWaiting) && !isCreator && (
            <Button
              variant="outline"
              onClick={handleLeaveLobby}
              disabled={isProcessing}
            >
              {isProcessing
                ? "Processing..."
                : isWaiting
                ? "Leave Waiting List"
                : "Leave Lobby"}
            </Button>
          )}

          {/* Cancel button for creator */}
          {currentLobby.status === "open" && isCreator && (
            <Button
              variant="danger"
              onClick={handleCancelLobby}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Cancel Lobby"}
            </Button>
          )}

          {currentLobby.status === "filled" && (
            <Link href={`/bookings`}>
              <Button>View Booking</Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
