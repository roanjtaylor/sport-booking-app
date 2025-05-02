// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { authApi, bookingsApi, facilitiesApi, usersApi } from "@/lib/api";

interface Profile {
  id: string;
  name: string | null;
  role: "user" | "facility_owner";
  email: string;
}

interface DashboardStats {
  upcomingBookings: number;
  totalBookings: number;
  facilities: number;
  pendingRequests?: number;
}

export default function DashboardPage() {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    upcomingBookings: 0,
    totalBookings: 0,
    facilities: 0,
    pendingRequests: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [facilityList, setFacilityList] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    // Fetch user data and statistics on component mount
    async function fetchUserData() {
      try {
        setIsLoading(true);

        // Get the current user
        const { data: authUser, error: authError } =
          await authApi.getCurrentUser();

        if (authError || !authUser) {
          setError("You must be logged in to view your dashboard");
          return;
        }

        setUser(authUser);

        // Fetch user profile with role information
        const { data: profileData, error: profileError } =
          await usersApi.getUserProfile(authUser.id);

        if (profileError) throw profileError;
        if (!profileData) throw new Error("Profile not found");

        setProfile({
          ...profileData,
          email: authUser.email || "",
        });

        // Calculate statistics and fetch relevant data based on user role
        if (profileData.role === "facility_owner") {
          await fetchFacilityOwnerData(authUser.id);
        } else {
          await fetchRegularUserData(authUser.id);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  /**
   * Fetches all necessary data for facility owners
   */
  const fetchFacilityOwnerData = async (userId: string) => {
    try {
      // Get owner statistics
      const { data: statData, error: statError } =
        await usersApi.getFacilityOwnerStats(userId);

      if (statError) throw statError;

      if (statData) {
        setStats(statData);
      }

      // Get facilities owned by user
      const { data: userFacilities, error: facilitiesError } =
        await facilitiesApi.getUserFacilities(userId);

      if (facilitiesError) throw facilitiesError;

      setFacilityList(userFacilities || []);

      // If there are no facilities, we're done
      if (!userFacilities || userFacilities.length === 0) {
        return;
      }

      // Get facility IDs for query
      const facilityIds = userFacilities.map((f) => f.id);

      // Fetch recent pending requests
      const pendingBookingsPromises = facilityIds.map((facilityId) =>
        bookingsApi.getFacilityBookings(facilityId)
      );

      const pendingResults = await Promise.all(pendingBookingsPromises);

      // Combine results and filter for pending status
      let allPendingBookings: any[] = [];
      pendingResults.forEach((result) => {
        if (result.data) {
          allPendingBookings = [
            ...allPendingBookings,
            ...result.data.filter((booking) => booking.status === "pending"),
          ];
        }
      });

      // Sort by date (ascending) and limit to 5
      allPendingBookings.sort((a, b) => a.date.localeCompare(b.date));

      // Limit to 5 most recent
      const recentPendingBookings = allPendingBookings.slice(0, 5);

      // Add facility info to each booking
      const pendingWithFacility = recentPendingBookings.map((booking) => {
        const facility = userFacilities.find(
          (f) => f.id === booking.facility_id
        );
        return {
          ...booking,
          facility: facility || { name: "Unknown" },
        };
      });

      setPendingRequests(pendingWithFacility);
    } catch (error) {
      console.error("Error fetching facility owner data:", error);
      // Set default values in case of error
      setStats({
        facilities: 0,
        totalBookings: 0,
        upcomingBookings: 0,
        pendingRequests: 0,
      });
    }
  };

  /**
   * Fetches all necessary data for regular users
   */
  const fetchRegularUserData = async (userId: string) => {
    try {
      // Get user booking stats
      const { data: statData, error: statError } =
        await usersApi.getUserBookingStats(userId);

      if (statError) throw statError;

      if (statData) {
        setStats({
          ...stats,
          totalBookings: statData.totalBookings,
          upcomingBookings: statData.upcomingBookings,
        });
      }

      // Get recent upcoming bookings
      const { data: userBookings, error: bookingsError } =
        await bookingsApi.getUserBookings(userId);

      if (bookingsError) throw bookingsError;

      // Filter for upcoming bookings that aren't cancelled
      const today = new Date().toISOString().split("T")[0];
      const upcomingBookings = (userBookings || [])
        .filter((b) => b.date >= today && b.status !== "cancelled")
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);

      setRecentBookings(upcomingBookings);

      // Fetch some recommended facilities
      const { data: facilities, error: facilitiesError } =
        await facilitiesApi.getAllFacilities();

      if (facilitiesError) throw facilitiesError;

      // Just take the first 3 facilities for recommendations
      setFacilityList(facilities?.slice(0, 3) || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Set default values in case of error
      setStats({ facilities: 0, totalBookings: 0, upcomingBookings: 0 });
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEE, MMM d, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, "h:mm a");
    } catch (e) {
      return timeStr;
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading your dashboard..." />;
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

  // Determine whether to show facility owner or regular user dashboard
  const isFacilityOwner = profile?.role === "facility_owner";

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {profile?.name || user?.email}
          </p>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Show different stats based on user role - example cards */}
        {isFacilityOwner ? (
          // Facility Owner Statistics
          <>
            <Card className="p-6 border-l-4 border-orange-500">
              <h3 className="text-lg font-medium mb-2">Your Facilities</h3>
              <p className="text-3xl font-bold text-primary-600">
                {stats.facilities}
              </p>
              <div
                style={{ display: "flex", flexDirection: "row", gap: "1rem" }}
              >
                <div className="mt-4">
                  <Link href="/facilities/add">
                    <Button variant="outline" size="sm">
                      Add Facility
                    </Button>
                  </Link>
                </div>
                <div className="mt-4">
                  <Link href="/dashboard/facilities" className="block">
                    <Button variant="outline" size="sm">
                      Manage Facilities
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            <Link href="/dashboard/facility-bookings">
              <Card className="p-6 border-l-4 border-green-500">
                <h3 className="text-lg font-medium mb-2">Upcoming Bookings</h3>
                <p className="text-3xl font-bold text-primary-600">
                  {stats.upcomingBookings}
                </p>
                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    View Bookings
                  </Button>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/settings" className="block">
              <Card className="p-6 h-full hover:shadow-md transition border-l-4 border-purple-500">
                <h3 className="text-lg font-medium mb-2">Profile Settings</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Update your personal information and preferences
                </p>
                <Button variant="outline" size="sm">
                  Settings
                </Button>
              </Card>
            </Link>
          </>
        ) : (
          // Regular User Main Action Cards
          <>
            <Link href="/discover" className="block">
              <Card className="p-6 h-full hover:shadow-md transition border-l-4 border-orange-500">
                <h3 className="text-lg font-medium mb-2">Discover</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Find facilities and lobbies
                </p>
                <Button variant="outline" size="sm">
                  Explore
                </Button>
              </Card>
            </Link>

            <Link href="/bookings" className="block">
              <Card className="p-6 h-full hover:shadow-md transition border-l-4 border-green-500">
                <h3 className="text-lg font-medium mb-2">My Bookings</h3>
                <p className="text-sm text-gray-600 mb-4">
                  View and manage your bookings
                </p>
                <Button variant="outline" size="sm">
                  Bookings
                </Button>
              </Card>
            </Link>

            <Link href="/dashboard/settings" className="block">
              <Card className="p-6 h-full hover:shadow-md transition border-l-4 border-purple-500">
                <h3 className="text-lg font-medium mb-2">Profile Settings</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Update your personal information and preferences
                </p>
                <Button variant="outline" size="sm">
                  Settings
                </Button>
              </Card>
            </Link>
          </>
        )}
      </div>

      {/* Recent activity section - different for each user type */}
      {isFacilityOwner ? (
        // Facility Owner - Recent Booking Requests
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Booking Requests</h2>
            <Link href="/dashboard/facility-bookings">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {pendingRequests && pendingRequests.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Facility
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingRequests.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {booking.facility ? booking.facility.name : "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(booking.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(booking.start_time)} -{" "}
                          {formatTime(booking.end_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link
                            href={`/dashboard/facility-bookings#${booking.id}`}
                          >
                            <Button variant="outline" size="sm">
                              Review
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pendingRequests.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500">No pending booking requests</p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-gray-500">
                You don't have any pending booking requests
              </p>
              <div className="mt-4">
                <Link href="/dashboard/facilities">
                  <Button variant="primary" size="sm">
                    Manage Facilities
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      ) : (
        // Regular User - Upcoming Bookings
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Upcoming Bookings</h2>
            <Link href="/bookings">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {recentBookings && recentBookings.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Facility
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {booking.facility ? booking.facility.name : "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(booking.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(booking.start_time)} -{" "}
                          {formatTime(booking.end_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {booking.status.charAt(0).toUpperCase() +
                              booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link href={`/bookings/${booking.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {recentBookings.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500">
                    You don't have any upcoming bookings
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-gray-500">
                You don't have any upcoming bookings
              </p>
              <div className="mt-4">
                <Link href="/discover">
                  <Button variant="primary" size="sm">
                    Browse Facilities & Lobbies
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Facility list for owner / Recommended facilities for user */}
      {isFacilityOwner && facilityList && facilityList.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Facilities</h2>
            <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
              <Link href="/facilities/add">
                <Button variant="outline" size="sm">
                  Add Facility
                </Button>
              </Link>
              <Link href="/dashboard/facilities" className="block">
                <Button variant="outline" size="sm">
                  Manage Facilities
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {facilityList.map((facility) => (
              <Card
                key={facility.id}
                className="p-4 hover:shadow-md transition"
              >
                <h3 className="font-medium mb-1">{facility.name}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {facility.address}, {facility.city}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {/* Make sure sportType or sport_type exists before mapping */}
                  {facility.sportType &&
                    facility.sportType.map((sport) => (
                      <span
                        key={sport}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {sport}
                      </span>
                    ))}
                  {facility.sport_type &&
                    facility.sport_type.map((sport) => (
                      <span
                        key={sport}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {sport}
                      </span>
                    ))}
                </div>
                <div className="flex justify-end">
                  <Link href={`/facilities/${facility.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!isFacilityOwner && facilityList && facilityList.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recommended Facilities</h2>
            <Link href="/discover">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {facilityList.map((facility) => (
              <Card
                key={facility.id}
                className="p-4 hover:shadow-md transition"
              >
                <h3 className="font-medium mb-1">{facility.name}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {facility.address}, {facility.city}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {/* Make sure sportType or sport_type exists before mapping */}
                  {facility.sportType &&
                    facility.sportType.map((sport) => (
                      <span
                        key={sport}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {sport}
                      </span>
                    ))}
                  {facility.sport_type &&
                    facility.sport_type.map((sport) => (
                      <span
                        key={sport}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {sport}
                      </span>
                    ))}
                </div>
                <div className="flex justify-end">
                  <Link href={`/facilities/${facility.id}`}>
                    <Button variant="primary" size="sm">
                      Book Now
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
