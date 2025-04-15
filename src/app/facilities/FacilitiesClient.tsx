// src/app/facilities/FacilitiesClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { FacilityFilters } from "@/components/facilities/FacilityFilters";
import { supabase } from "@/lib/supabase";
import { Facility } from "@/types/facility";
import { formatPrice } from "@/lib/utils";

export default function FacilitiesClient({
  initialFacilities,
}: {
  initialFacilities: Facility[];
}) {
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sportTypes, setSportTypes] = useState<string[]>([
    "Football",
    "outdoors",
    "indoors",
    "11 aside",
    "7 aside",
    "5 aside",
  ]);

  const handleFilter = async (filters: {
    search: string;
    sportType: string;
    priceSort: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase.from("facilities").select("*");

      // Add search filter
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,address.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
        );
      }

      // Add sport type filter
      if (filters.sportType) {
        query = query.contains("sport_type", [filters.sportType]);
      }

      // Add sorting
      if (filters.priceSort === "low") {
        query = query.order("price_per_hour", { ascending: true });
      } else if (filters.priceSort === "high") {
        query = query.order("price_per_hour", { ascending: false });
      } else {
        // Default sorting by created_at desc
        query = query.order("created_at", { ascending: false });
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // Map to our Facility type
      const formattedFacilities =
        data?.map((facility) => ({
          id: facility.id,
          name: facility.name,
          description: facility.description,
          address: facility.address,
          city: facility.city,
          postal_code: facility.postal_code,
          country: facility.country,
          imageUrl: facility.image_url,
          owner_id: facility.owner_id,
          operatingHours: facility.operating_hours,
          price_per_hour: facility.price_per_hour,
          currency: facility.currency,
          sportType: facility.sport_type,
          amenities: facility.amenities || [],
        })) || [];

      setFacilities(formattedFacilities);
    } catch (err) {
      console.error("Error filtering facilities:", err);
      setError("Failed to filter facilities. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Search and filter controls */}
      <div className="mb-8">
        <FacilityFilters onFilter={handleFilter} sportTypes={sportTypes} />
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading facilities...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Facilities grid */}
      {!isLoading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.length > 0 ? (
            facilities.map((facility) => (
              <Card
                key={facility.id}
                className="h-full flex flex-col transition-shadow hover:shadow-lg"
              >
                {/* Facility image placeholder */}
                <div className="bg-gray-200 h-48 flex items-center justify-center">
                  {facility.imageUrl ? (
                    <img
                      src={facility.imageUrl}
                      alt={facility.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">Facility Image</span>
                  )}
                </div>

                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="text-lg font-semibold mb-1">
                    {facility.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {facility.address}
                  </p>

                  {/* Sport types */}
                  <div className="mb-3 flex flex-wrap gap-1">
                    {facility.sportType.map((sport: string) => (
                      <span
                        key={sport}
                        className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded"
                      >
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {facility.description}
                  </p>

                  {/* Price and booking button */}
                  <div className="mt-auto flex justify-between items-center">
                    <span className="font-medium text-primary-600">
                      {formatPrice(facility.price_per_hour, facility.currency)}
                      /hour
                    </span>
                    <Link href={`/facilities/${facility.id}`}>
                      <Button variant="primary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-3 py-8 text-center">
              <p className="text-gray-500">
                No facilities found. Try adjusting your search filters.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
