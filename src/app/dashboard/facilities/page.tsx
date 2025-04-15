// src/app/dashboard/facilities/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { Facility } from "@/types/facility";
import { formatPrice } from "@/lib/utils";

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

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        setError("You must be logged in to view your facilities");
        setIsLoading(false);
        return;
      }

      // Fetch facilities owned by the current user
      const { data, error: facilitiesError } = await supabase
        .from("facilities")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (facilitiesError) throw facilitiesError;

      // Convert to our Facility type
      const formattedFacilities: Facility[] = (data || []).map((facility) => ({
        id: facility.id,
        name: facility.name,
        description: facility.description,
        address: facility.address,
        city: facility.city,
        postal_code: facility.postal_code,
        country: facility.country,
        imageUrl: facility.image_url,
        owner_id: facility.owner_id,
        owner_email: facility.owner_email,
        operatingHours: facility.operating_hours,
        price_per_hour: facility.price_per_hour,
        currency: facility.currency,
        sportType: facility.sport_type,
        amenities: facility.amenities || [],
        min_players: facility.min_players,
      }));

      setFacilities(formattedFacilities);
    } catch (err) {
      console.error("Error fetching facilities:", err);
      setError("Failed to load your facilities");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your facilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Your Facilities</h1>
          <p className="text-gray-600">
            Edit, manage bookings, or create new facilities
          </p>
        </div>
        <Link href="/facilities/add">
          <Button>Add New Facility</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

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
    </div>
  );
}
