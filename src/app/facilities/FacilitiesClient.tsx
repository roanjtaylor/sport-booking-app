// src/app/facilities/FacilitiesClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Facility } from "@/types/facility";
import { formatPrice } from "@/lib/utils";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";

export default function FacilitiesClient({
  initialFacilities,
  isFiltered = false,
}: {
  initialFacilities: Facility[];
  isFiltered?: boolean;
}) {
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update facilities when initialFacilities change
  useEffect(() => {
    setFacilities(initialFacilities);
  }, [initialFacilities]);

  return (
    <div>
      {isLoading && <LoadingIndicator message="Loading facilities..." />}

      <ErrorDisplay error={error} className="mb-6" />

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
            <div className="col-span-3">
              <EmptyState
                title="No facilities found"
                message="Try adjusting your search filters."
                variant="expanded"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
