// src/app/dashboard/facilities/page.tsx - Refactored
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Facility } from "@/types/facility";
import { formatPrice } from "@/lib/utils";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { authApi, facilitiesApi } from "@/lib/api";
import { DashboardLayout } from "@/components/layouts";

export default function ManageFacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOwnerFacilities();
  }, []);

  async function fetchOwnerFacilities() {
    try {
      setIsLoading(true);

      // Get current user using the auth API
      const { data: user, error: userError } = await authApi.getCurrentUser();

      if (userError || !user) {
        setError("You must be logged in to view your facilities");
        return;
      }

      // Fetch facilities owned by the user using the facilities API
      const { data, error: facilitiesError } =
        await facilitiesApi.getUserFacilities(user.id);

      if (facilitiesError) throw facilitiesError;
      setFacilities(data || []);
    } catch (err) {
      console.error("Error fetching facilities:", err);
      setError("Failed to load your facilities");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <LoadingIndicator message="Loading your facilities..." />;
  }

  const addFacilityButton = (
    <Link href="/facilities/add">
      <Button>Add New Facility</Button>
    </Link>
  );

  return (
    <DashboardLayout
      title="My Facilities"
      description="Edit and manage your facilities"
      actions={addFacilityButton}
    >
      <ErrorDisplay error={error} className="mb-6" />

      {/* Render facilities grid or empty state */}
      {facilities.length === 0 ? (
        <Card className="p-6 text-center">
          <h3 className="text-lg font-medium mb-2">No facilities found</h3>
          <p className="text-gray-500 mb-6">
            You haven't created any facilities yet.
          </p>
          <Link href="/facilities/add">
            <Button>Create Your First Facility</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <Card key={facility.id} className="overflow-hidden">
              {/* Facility image */}
              <div className="bg-gray-200 h-48 relative">
                {facility.imageUrl ? (
                  <img
                    src={facility.imageUrl}
                    alt={facility.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image available
                  </div>
                )}
              </div>

              {/* Facility details */}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">{facility.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{facility.address}</p>

                {/* Sport types */}
                <div className="mb-3 flex flex-wrap gap-1">
                  {facility.sportType.map((sport) => (
                    <span
                      key={sport}
                      className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded"
                    >
                      {sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </span>
                  ))}
                </div>

                {/* Price info */}
                <div className="mb-4">
                  <span className="font-medium text-primary-600">
                    {formatPrice(facility.price_per_hour, facility.currency)}
                    /hour
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Link href={`/facilities/${facility.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/facilities/${facility.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit Facility
                    </Button>
                  </Link>
                  <Link href="/dashboard/facility-bookings">
                    <Button variant="primary" size="sm">
                      Bookings
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
