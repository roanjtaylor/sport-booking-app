"use client";

// src/components/discover/MapView.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { Facility } from "@/types/facility";

/**
 * Map View component for the Discover page
 * Displays facilities on an interactive map
 * Note: This is a placeholder that will be expanded with actual mapping functionality
 */
export default function MapView() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch facilities data when component mounts
  useEffect(() => {
    async function fetchFacilities() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: facilitiesError } = await supabase
          .from("facilities")
          .select("*")
          .order("created_at", { ascending: false });

        if (facilitiesError) throw facilitiesError;

        // Format facilities data
        const formattedFacilities: Facility[] = (data || []).map(
          (facility) => ({
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
            // For now, we'll need to extract coordinates from the address
            // This will be replaced with actual lat/lng data later
          })
        );

        setFacilities(formattedFacilities);
      } catch (err) {
        console.error("Error fetching facilities:", err);
        setError("Failed to load facilities data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFacilities();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading facilities map...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Map View</h2>
        <p className="text-gray-600">
          This feature will display {facilities.length} facilities on an
          interactive map.
        </p>
      </div>

      {/* Placeholder for map implementation */}
      <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-lg font-medium mb-2">
            Map Implementation Coming Soon
          </p>
          <p className="text-gray-600 mb-4">
            This feature will require updating the database to store facility
            coordinates and implementing a map library like Google Maps or
            MapBox.
          </p>
          <div className="bg-white p-4 rounded shadow-sm mb-4 max-w-lg mx-auto">
            <p className="font-medium mb-2">Planned Implementation:</p>
            <ul className="text-left text-sm list-disc pl-5 space-y-1">
              <li>Update facility schema to store latitude/longitude</li>
              <li>Modify facility forms to capture location data</li>
              <li>Implement geocoding for existing addresses</li>
              <li>Add interactive map with facility markers</li>
              <li>Enable popup details when clicking facility markers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* List of facilities that would appear on the map */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Available Facilities</h3>
        <div className="bg-white rounded-lg border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {facilities.slice(0, 5).map((facility) => (
              <li key={facility.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{facility.name}</p>
                    <p className="text-sm text-gray-600">
                      {facility.address}, {facility.city}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </li>
            ))}
            {facilities.length > 5 && (
              <li className="p-4 text-center text-gray-500">
                + {facilities.length - 5} more facilities
              </li>
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
}
