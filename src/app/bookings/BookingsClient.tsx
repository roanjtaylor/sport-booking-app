"use client";

// src/app/bookings/BookingsClient.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { BookingsList } from "@/components/bookings/BookingsList";
import { UserLobbiesList } from "@/components/bookings/UserLobbiesList";
import { Lobby } from "@/types/lobby";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { authApi, bookingsApi, lobbiesApi } from "@/lib/api";

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
        const { data: user, error: userError } = await authApi.getCurrentUser();

        if (userError || !user) {
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

  // Fetch user's bookings using the API service
  async function fetchBookings(userId: string) {
    try {
      const { data, error } = await bookingsApi.getUserBookings(userId);

      if (error) throw error;
      if (!data) throw new Error("No booking data returned");

      setBookings(data);

      // Initial filtering based on tab
      if (activeTab === "confirmed") {
        setFilteredBookings(
          data.filter((booking) => booking.status === "confirmed")
        );
      } else if (activeTab === "pending") {
        setFilteredBookings(
          data.filter((booking) => booking.status === "pending")
        );
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      throw err;
    }
  }

  // Fetch user's lobbies using the API service
  async function fetchUserLobbies(userId: string) {
    try {
      const { data, error } = await lobbiesApi.getUserLobbies(userId);

      if (error) throw error;
      setLobbies(data || []);
    } catch (err) {
      console.error("Error fetching user lobbies:", err);
      throw err;
    }
  }

  if (isLoading) {
    return <LoadingIndicator message="Loading your bookings..." />;
  }

  if (error) {
    return (
      <div className="py-12">
        <Card className="p-6 max-w-md mx-auto">
          <EmptyState
            title="Error"
            message={error}
            actionLink="/auth/login"
            actionText="Sign In"
          />
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
          <EmptyState
            title="No active lobbies found"
            message="You are not currently part of any lobby groups."
            actionLink="/discover"
            actionText="Find Lobbies"
          />
        ) : (
          <UserLobbiesList lobbies={lobbies} />
        )
      ) : // Render bookings (confirmed or pending)
      filteredBookings.length === 0 ? (
        <EmptyState
          title="No bookings found"
          message={`You don't have any ${activeTab} bookings.`}
          actionLink="/discover"
          actionText="Find a Facility"
        />
      ) : (
        <BookingsList bookings={filteredBookings} />
      )}
    </div>
  );
}
