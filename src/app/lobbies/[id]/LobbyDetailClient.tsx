// src/app/lobbies/[id]/LobbyDetailClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { Lobby, LobbyParticipant } from "@/types/lobby";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import Link from "next/link";
import { joinLobby } from "@/lib/lobbies";

type LobbyDetailClientProps = {
  lobby: Lobby;
};

/**
 * Client component for handling lobby detail interactions
 */
export default function LobbyDetailClient({ lobby }: LobbyDetailClientProps) {
  const router = useRouter();

  // State variables
  const [currentLobby, setCurrentLobby] = useState<Lobby>(lobby);
  const [isCreator, setIsCreator] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [waitingList, setWaitingList] = useState<LobbyParticipant[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitingPosition, setWaitingPosition] = useState<number | null>(null);

  // Check if user is authenticated, creator, or participant and fetch lobby data
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          setUserEmail(user.email);
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

  // Fetch complete lobby data including waiting list
  const fetchLobbyData = async (currentUserId: string) => {
    try {
      // Get fresh lobby data directly from the database
      const { data: freshLobby, error: lobbyError } = await supabase
        .from("lobbies")
        .select("*")
        .eq("id", lobby.id)
        .single();

      if (lobbyError) throw lobbyError;

      // Fetch lobby participants
      const { data: participantsData, error: participantsError } =
        await supabase
          .from("lobby_participants")
          .select("*, user:user_id(*)")
          .eq("lobby_id", lobby.id);

      if (participantsError) throw participantsError;

      // Separate active participants from waiting list
      const activeParticipants: LobbyParticipant[] = [];
      const waitingParticipants: LobbyParticipant[] = [];

      participantsData.forEach((participant) => {
        if (participant.is_waiting) {
          waitingParticipants.push(participant);

          // Check if current user is in waiting list
          if (participant.user_id === currentUserId) {
            setIsWaiting(true);
            setWaitingPosition(participant.waiting_position);
            setIsParticipant(false);
          }
        } else {
          activeParticipants.push(participant);

          // Check if current user is an active participant
          if (participant.user_id === currentUserId) {
            setIsParticipant(true);
          }
        }
      });

      // Sort waiting list by position
      waitingParticipants.sort(
        (a, b) => (a.waiting_position || 0) - (b.waiting_position || 0)
      );

      setWaitingList(waitingParticipants);
      setCurrentLobby({
        ...freshLobby,
        participants: activeParticipants,
      });
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

      // Use the centralized joinLobby function
      const email = userEmail || "";
      const result = await joinLobby(lobby.id, userId, email);

      // Success - refresh or redirect
      if (result.isFull) {
        alert(
          "Congratulations! The lobby is now full and a booking has been created."
        );
      }

      // Update local state to reflect changes immediately
      setCurrentLobby((prev) => ({
        ...prev,
        current_players: result.newCount,
        status: result.isFull ? "filled" : "open",
      }));

      // Set the user as participant in local state
      setIsParticipant(true);

      // Refresh the page to show updated data
      router.refresh();
    } catch (err: any) {
      console.error("Error joining lobby:", err);
      setError(err.message || "Failed to join lobby");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to create a booking when a lobby fills
  const createBookingFromFilledLobby = async () => {
    try {
      // Get facility price information
      const { data: facility, error: facilityError } = await supabase
        .from("facilities")
        .select("price_per_hour")
        .eq("id", currentLobby.facility_id)
        .single();

      if (facilityError) throw facilityError;

      // Create a booking from this lobby
      const { error: bookingError } = await supabase.from("bookings").insert({
        facility_id: currentLobby.facility_id,
        user_id: currentLobby.creator_id,
        date: currentLobby.date,
        start_time: currentLobby.start_time,
        end_time: currentLobby.end_time,
        status: "pending",
        total_price: facility.price_per_hour,
        notes: `Group booking from lobby: ${currentLobby.id}`,
        lobby_id: currentLobby.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (bookingError) throw bookingError;
    } catch (err) {
      console.error("Error creating booking:", err);
      throw err;
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

      // Check if user is on waiting list or active participant
      if (isWaiting) {
        // Leave from waiting list
        const { error: deleteError } = await supabase
          .from("lobby_participants")
          .delete()
          .eq("lobby_id", lobby.id)
          .eq("user_id", userId);

        if (deleteError) throw deleteError;

        // Update waiting positions for everyone behind this person
        await supabase.rpc("reorder_waiting_positions", {
          p_lobby_id: lobby.id,
          p_left_position: waitingPosition,
        });

        // Decrease waiting count on lobby
        await supabase
          .from("lobbies")
          .update({
            waiting_count: supabase.rpc("decrement_waiting_count", {
              lobby_id: lobby.id,
            }),
            updated_at: new Date().toISOString(),
          })
          .eq("id", lobby.id);
      } else {
        // Leave as active participant
        const { error: deleteError } = await supabase
          .from("lobby_participants")
          .delete()
          .eq("lobby_id", lobby.id)
          .eq("user_id", userId);

        if (deleteError) throw deleteError;

        // Check if we need to promote someone from waiting list
        const { data: lobby } = await supabase
          .from("lobbies")
          .select("current_players, min_players, status, waiting_count")
          .eq("id", currentLobby.id)
          .single();

        let newCount = lobby.current_players - 1;

        if (lobby.waiting_count > 0) {
          // Find next waiting person
          const { data: nextPerson } = await supabase
            .from("lobby_participants")
            .select("user_id")
            .eq("lobby_id", currentLobby.id)
            .eq("is_waiting", true)
            .eq("waiting_position", 1)
            .single();

          if (nextPerson) {
            // Promote this person
            await supabase
              .from("lobby_participants")
              .update({ is_waiting: false, waiting_position: null })
              .eq("lobby_id", currentLobby.id)
              .eq("user_id", nextPerson.user_id);

            // Don't decrement current_players since we're replacing the person
            newCount = lobby.current_players;

            // Update waiting positions for everyone else
            await supabase.rpc("shift_waiting_positions", {
              lobby_id: currentLobby.id,
            });

            // Decrease waiting count
            await supabase
              .from("lobbies")
              .update({
                waiting_count: Math.max(0, lobby.waiting_count - 1),
                updated_at: new Date().toISOString(),
              })
              .eq("id", currentLobby.id);
          }
        }

        // Update player count
        await supabase
          .from("lobbies")
          .update({
            current_players: newCount,
            status: newCount >= lobby.min_players ? "filled" : "open",
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentLobby.id);
      }

      // Redirect to facility page
      router.push("/facilities/" + currentLobby.facility_id);
      router.refresh();
    } catch (err: any) {
      console.error("Error leaving lobby:", err);
      setError(err.message || "Failed to leave lobby");
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

      // Update lobby status to cancelled
      const { error: updateError } = await supabase
        .from("lobbies")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", lobby.id);

      if (updateError) throw updateError;

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
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading lobby details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => setError(null)}>Dismiss</Button>
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
                  {currentLobby.facility?.sport_type
                    ? currentLobby.facility.sport_type.map((sport: string) => (
                        <span
                          key={sport}
                          className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                        >
                          {sport.charAt(0).toUpperCase() + sport.slice(1)}
                        </span>
                      ))
                    : currentLobby.facility?.sportType?.map((sport: string) => (
                        <span
                          key={sport}
                          className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                        >
                          {sport.charAt(0).toUpperCase() + sport.slice(1)}
                        </span>
                      ))}
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

        {/* Waiting list section */}
        {waitingList.length > 0 && (
          <div className="mt-8">
            <h4 className="font-medium text-gray-900 mb-3">
              Waiting List ({waitingList.length})
            </h4>
            <div className="bg-gray-50 rounded-md p-4">
              <ul className="divide-y divide-gray-200">
                {waitingList.map((participant, index) => (
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

          {currentLobby.status === "open" && !isParticipant && !isWaiting && (
            <Button onClick={handleJoinLobby} disabled={isProcessing}>
              {currentLobby.current_players >= currentLobby.min_players
                ? "Join Waiting List"
                : "Join Lobby"}
            </Button>
          )}

          {currentLobby.status === "open" && isParticipant && !isCreator && (
            <Button
              variant="outline"
              onClick={handleLeaveLobby}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Leave Lobby"}
            </Button>
          )}

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
