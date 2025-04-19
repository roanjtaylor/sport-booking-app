"use client";

// src/app/bookings/BookingsClient.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookingsList } from "@/components/bookings/BookingsList";
import { UserLobbiesList } from "@/components/bookings/UserLobbiesList";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Lobby } from "@/types/lobby";

/**
 * Client component for handling booking data fetching and interactivity
 * Updated tab structure to: Confirmed Bookings, Pending Requests, Lobbies in progress
 */
export default function BookingsClient() {
  // Tabs are now: "confirmed", "pending", "lobbies"
  const [activeTab, setActiveTab] = useState("confirmed");
  const [bookings, setBookings] = useState<any[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);

  useEffect(() => {
    // Fetch bookings for the current user
    async function fetchUserData() {
      try {
        // Check if user is authenticated
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to view your bookings");
          setIsLoading(false);
          return;
        }

        // Fetch bookings and lobbies in parallel for efficiency
        await Promise.all([fetchBookings(user.id), fetchUserLobbies(user.id)]);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load your data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // Effect to filter bookings when active tab or bookings change
  useEffect(() => {
    filterBookingsByTab();
  }, [activeTab, bookings]);

  // Filter bookings based on active tab
  const filterBookingsByTab = () => {
    if (activeTab === "confirmed") {
      setFilteredBookings(
        bookings.filter((booking) => booking.status === "confirmed")
      );
    } else if (activeTab === "pending") {
      setFilteredBookings(
        bookings.filter((booking) => booking.status === "pending")
      );
    }
    // For "lobbies" tab we don't need to filter bookings
  };

  // Fetch user's bookings
  async function fetchBookings(userId: string) {
    try {
      // First fetch direct bookings
      const { data: directBookings, error: directBookingsError } =
        await supabase
          .from("bookings")
          .select(
            `
          *,
          facility:facilities(*)
        `
          )
          .eq("user_id", userId)
          .order("date", { ascending: true });

      if (directBookingsError) throw directBookingsError;

      // Then fetch lobby bookings where user is a participant
      const { data: lobbyParticipations, error: lobbyError } = await supabase
        .from("lobby_participants")
        .select("lobby_id")
        .eq("user_id", userId)
        .eq("is_waiting", false); // Only include active participations

      if (lobbyError) throw lobbyError;

      // If user is part of any lobbies, fetch related bookings
      let lobbyBookings: any[] = [];
      if (lobbyParticipations && lobbyParticipations.length > 0) {
        const lobbyIds = lobbyParticipations.map((p) => p.lobby_id);

        const { data: bookingsFromLobbies, error: lobbyBookingsError } =
          await supabase
            .from("bookings")
            .select(
              `
            *,
            facility:facilities(*)
          `
            )
            .in("lobby_id", lobbyIds)
            .order("date", { ascending: true });

        if (lobbyBookingsError) throw lobbyBookingsError;

        lobbyBookings = bookingsFromLobbies || [];
      }

      // Combine both types of bookings, removing duplicates
      const allBookings = [...(directBookings || [])];

      // Add lobby bookings that aren't already in the list (to avoid duplicates)
      lobbyBookings.forEach((lobbyBooking) => {
        if (!allBookings.some((b) => b.id === lobbyBooking.id)) {
          // Mark that this is a lobby booking the user participated in
          lobbyBooking.isLobbyParticipant = true;
          allBookings.push(lobbyBooking);
        }
      });

      // Ensure ordered by date and time
      allBookings.sort((a, b) => {
        // First compare by date
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;

        // If same date, compare by start time
        if (a.start_time < b.start_time) return -1;
        if (a.start_time > b.start_time) return 1;

        return 0;
      });

      setBookings(allBookings);
      // Initial filtering based on tab
      if (activeTab === "confirmed") {
        setFilteredBookings(
          allBookings.filter((booking) => booking.status === "confirmed")
        );
      } else if (activeTab === "pending") {
        setFilteredBookings(
          allBookings.filter((booking) => booking.status === "pending")
        );
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      throw err;
    }
  }

  // New function to fetch user's lobbies
  async function fetchUserLobbies(userId: string) {
    try {
      // Get all lobby participation records for the user
      const { data: participations, error: participationsError } =
        await supabase
          .from("lobby_participants")
          .select("lobby_id")
          .eq("user_id", userId)
          .eq("is_waiting", false); // Only include active participations

      if (participationsError) throw participationsError;

      if (!participations || participations.length === 0) {
        setLobbies([]);
        return;
      }

      // Get all lobby IDs where the user is a participant
      const lobbyIds = participations.map((p) => p.lobby_id);

      // Fetch the lobby details with facility information
      const { data: userLobbies, error: lobbiesError } = await supabase
        .from("lobbies")
        .select(
          `
          *,
          facility:facility_id(*)
        `
        )
        .in("id", lobbyIds)
        .not("status", "in", '("cancelled", "expired")')
        .order("date", { ascending: true });

      if (lobbiesError) throw lobbiesError;

      // Add creator info to each lobby
      const lobbiesWithCreators = await Promise.all(
        (userLobbies || []).map(async (lobby) => {
          // Get creator info
          const { data: creatorData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", lobby.creator_id)
            .single();

          return {
            ...lobby,
            creator: creatorData,
            isCreator: userId === lobby.creator_id,
          };
        })
      );

      setLobbies(lobbiesWithCreators || []);
    } catch (err) {
      console.error("Error fetching user lobbies:", err);
      throw err;
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <Card className="p-6 max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs for filtering bookings */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("confirmed")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "confirmed"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Confirmed Bookings
            {bookings.filter((b) => b.status === "confirmed").length > 0 &&
              ` (${bookings.filter((b) => b.status === "confirmed").length})`}
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pending"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Pending Requests
            {bookings.filter((b) => b.status === "pending").length > 0 &&
              ` (${bookings.filter((b) => b.status === "pending").length})`}
          </button>

          <button
            onClick={() => setActiveTab("lobbies")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "lobbies"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Active Lobbies
            {lobbies.length > 0 && ` (${lobbies.length})`}
          </button>
        </nav>
      </div>

      {/* Display bookings or lobbies based on active tab */}
      {activeTab === "lobbies" ? (
        // Render lobbies
        lobbies.length === 0 ? (
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
        ) : (
          <UserLobbiesList lobbies={lobbies} />
        )
      ) : // Render bookings (confirmed or pending)
      filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {activeTab} bookings found
          </h3>
          <p className="text-gray-500 mb-6">
            {activeTab === "confirmed" &&
              "You don't have any confirmed bookings."}
            {activeTab === "pending" && "You don't have any pending requests."}
          </p>
          <Link href="/discover">
            <Button>Find a Facility</Button>
          </Link>
        </div>
      ) : (
        <BookingsList bookings={filteredBookings} />
      )}
    </div>
  );
}
