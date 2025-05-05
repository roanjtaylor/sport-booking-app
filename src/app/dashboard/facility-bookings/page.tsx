// src/app/dashboard/facility-bookings/page.tsx - Refactored
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { FacilityBookingsFilter } from "@/components/facilities/FacilityBookingsFilter";
import { Booking } from "@/types/booking";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { authApi, facilitiesApi, bookingsApi, usersApi } from "@/lib/api";
import { DashboardLayout } from "@/components/layouts";

interface FacilityBasic {
  id: string;
  name: string;
}

export default function FacilityBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<FacilityBasic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: user, error: userError } = await authApi.getCurrentUser();

      if (userError || !user) {
        setError("You must be logged in to view booking details");
        return;
      }

      // Get facilities owned by the user
      const { data: userFacilities, error: facilitiesError } =
        await facilitiesApi.getUserFacilities(user.id);

      if (facilitiesError) throw facilitiesError;

      // Extract basic facility info for the filter component
      const facilitiesBasic: FacilityBasic[] = (userFacilities || []).map(
        (f) => ({
          id: f.id,
          name: f.name,
        })
      );

      setFacilities(facilitiesBasic);

      if (!userFacilities?.length) {
        setBookings([]);
        setFilteredBookings([]);
        return;
      }

      const facilityIds = userFacilities.map((f) => f.id);

      // Loop through each facility to get its bookings
      const allBookings: Booking[] = [];

      for (const facilityId of facilityIds) {
        const { data: facilityBookings, error: bookingsError } =
          await bookingsApi.getFacilityBookings(facilityId);

        if (bookingsError) {
          console.error(
            `Error fetching bookings for facility ${facilityId}:`,
            bookingsError
          );
          continue;
        }

        if (facilityBookings) {
          allBookings.push(...facilityBookings);
        }
      }

      // Process bookings to add facility and user info
      const processedBookings = await Promise.all(
        allBookings.map(async (booking) => {
          // Get facility info
          const facility = userFacilities.find(
            (f) => f.id === booking.facility_id
          ) || {
            id: booking.facility_id,
            name: "Unknown Facility",
          };

          // Get user info
          const { data: userData, error: userError } =
            await usersApi.getUserProfile(booking.user_id);

          return {
            ...booking,
            facility,
            user: userData || { id: booking.user_id, email: "Unknown User" },
          };
        })
      );

      setBookings(processedBookings);
      setFilteredBookings(processedBookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  }

  const handleUpdateBookingStatus = async (
    bookingId: string,
    newStatus: "pending" | "confirmed" | "cancelled"
  ) => {
    try {
      // Update the booking status
      const { data, error } = await bookingsApi.updateBookingStatus(
        bookingId,
        newStatus
      );

      if (error) throw error;

      // Update local state
      const updatedBookings = bookings.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus } : b
      );

      setBookings(updatedBookings);
      setFilteredBookings(
        activeTab === "pending"
          ? updatedBookings.filter((b) => b.status === "pending")
          : updatedBookings
      );

      alert(
        `Booking ${
          newStatus === "confirmed" ? "approved" : "rejected"
        } successfully`
      );
    } catch (err) {
      console.error(`Error updating booking status:`, err);
      alert("Failed to update booking status");
    }
  };

  // The filter and tab handlers remain the same
  const handleTabChange = (tab: "all" | "pending") => {
    setActiveTab(tab);

    // Filter the bookings based on the selected tab
    if (tab === "pending") {
      setFilteredBookings(
        bookings.filter((booking) => booking.status === "pending")
      );
    } else {
      setFilteredBookings(bookings);
    }
  };

  const handleFilter = ({
    facilityId,
    status,
    dateRange,
  }: {
    facilityId: string;
    status: string;
    dateRange: string;
  }) => {
    let filtered = [...bookings];

    // Apply facility filter
    if (facilityId) {
      filtered = filtered.filter(
        (booking) => booking.facility?.id === facilityId
      );
    }

    // Apply status filter
    if (status) {
      filtered = filtered.filter((booking) => booking.status === status);
    } else if (activeTab === "pending") {
      filtered = filtered.filter((booking) => booking.status === "pending");
    }

    // Apply date range filter
    if (dateRange) {
      const today = new Date();
      let startDate: Date | undefined = undefined;
      let endDate: Date | undefined = undefined;

      if (dateRange === "today") {
        startDate = today;
        endDate = today;
      } else if (dateRange === "week") {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay() + 1); // Monday of current week
        endDate = new Date(today);
        endDate.setDate(startDate.getDate() + 6); // Sunday of current week
      } else if (dateRange === "month") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }

      if (startDate !== undefined && endDate !== undefined) {
        const formattedStartDate = startDate.toISOString().split("T")[0];
        const formattedEndDate = endDate.toISOString().split("T")[0];

        filtered = filtered.filter(
          (booking) =>
            booking.date >= formattedStartDate &&
            booking.date <= formattedEndDate
        );
      }
    }

    setFilteredBookings(filtered);
  };

  // UI rendering code remains mostly the same
  if (isLoading) {
    return <LoadingIndicator message="Loading facility bookings..." />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <EmptyState title="Error" message={error} variant="compact" />
      </Card>
    );
  }

  const dashboardButton = (
    <Link href="/dashboard">
      <Button variant="outline">Back to Dashboard</Button>
    </Link>
  );

  return (
    <DashboardLayout title="Manage Bookings" actions={dashboardButton}>
      {/* Filter component */}
      <FacilityBookingsFilter facilities={facilities} onFilter={handleFilter} />

      {/* Tabs for filtering bookings */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => handleTabChange("all")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "all"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Bookings
          </button>
          <button
            onClick={() => handleTabChange("pending")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pending"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Pending Requests{" "}
            {bookings.filter((b) => b.status === "pending").length > 0 &&
              `(${bookings.filter((b) => b.status === "pending").length})`}
          </button>
        </nav>
      </div>

      {filteredBookings.length === 0 ? (
        <Card className="p-6 text-center">
          <p>
            {activeTab === "all"
              ? "No bookings found for your facilities."
              : "No pending booking requests at this time."}
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booked By
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {booking.facility?.name || "Unknown Facility"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.user?.email || "Unknown User"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(booking.start_time)} -{" "}
                      {formatTime(booking.end_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.lobby_id ||
                      (booking.notes && booking.notes.includes("lobby")) ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Group Booking
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : booking.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {booking.status === "pending" && (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              handleUpdateBookingStatus(booking.id, "confirmed")
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleUpdateBookingStatus(booking.id, "cancelled")
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {booking.status !== "pending" && (
                        <Link href={`/bookings/${booking.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
