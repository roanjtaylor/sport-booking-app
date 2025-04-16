// src/components/discover/SearchResultsList.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { Facility } from "@/types/facility";
import { Lobby } from "@/types/lobby";

type SearchResultsListProps = {
  facilities: Facility[];
  lobbies: Lobby[];
  selectedDate: string;
  selectedTime: string;
};

export default function SearchResultsList({
  facilities,
  lobbies,
  selectedDate,
  selectedTime,
}: SearchResultsListProps) {
  // Check if we have any results to display
  const noResults = facilities.length === 0 && lobbies.length === 0;

  if (noResults) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">No available options found</h3>
        <p className="text-gray-600 mb-4">
          Try adjusting your date or time to find available facilities and
          lobbies.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Available Facilities Section */}
      {facilities.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Facilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map((facility) => (
              <Card
                key={facility.id}
                className="overflow-hidden flex flex-col h-full"
              >
                {/* Facility image */}
                <div className="bg-gray-200 h-40 relative">
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
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="text-lg font-semibold mb-1">
                    {facility.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-2">
                    {facility.address}, {facility.city}
                  </p>

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

                  {/* Price information */}
                  <div className="mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-primary-600">
                        {formatPrice(
                          facility.price_per_hour,
                          facility.currency
                        )}
                        /hour
                      </span>
                      <Link
                        href={`/facilities/${facility.id}?date=${selectedDate}&time=${selectedTime}`}
                      >
                        <Button variant="primary" size="sm">
                          Book Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Lobbies Section */}
      {lobbies.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Open Lobbies</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lobbies.map((lobby) => (
              <Card
                key={lobby.id}
                className="overflow-hidden flex flex-col h-full"
              >
                {/* Use the facility image for the lobby card */}
                <div className="bg-gray-200 h-40 relative">
                  {lobby.facility?.image_url ? (
                    <img
                      src={lobby.facility.image_url}
                      alt={lobby.facility?.name || "Facility"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image available
                    </div>
                  )}
                </div>

                {/* Lobby details */}
                <div className="p-4 flex-grow flex flex-col">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold mr-2">
                      {formatTime(lobby.start_time)} -{" "}
                      {formatTime(lobby.end_time)}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {lobby.current_players}/{lobby.min_players} Players
                    </span>
                  </div>

                  <p className="text-gray-500 text-sm mb-2">
                    {lobby.facility?.name || "Unknown Facility"}
                  </p>

                  <p className="text-gray-500 text-sm mb-2">
                    {lobby.facility?.address}, {lobby.facility?.city}
                  </p>

                  {lobby.notes && (
                    <p className="text-sm text-gray-600 mb-2 italic">
                      "{lobby.notes}"
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="mt-auto flex space-x-2">
                    <Link href={`/lobbies/${lobby.id}`} className="flex-grow">
                      <Button variant="outline" size="sm" fullWidth>
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/lobbies/${lobby.id}`} className="flex-grow">
                      <Button variant="primary" size="sm" fullWidth>
                        Join Lobby
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
