// src/app/facilities/[id]/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPrice, formatTime } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import BookingFormWrapper from "@/components/bookings/BookingFormWrapper";
import { FacilityOwnerActions } from "@/components/facilities/FacilityOwnerActions";
import { Facility } from "@/types/facility";
import { LobbyList } from "@/components/lobbies/LobbyList";

// Define the expected params type
type Props = {
  params: {
    id: string;
  };
};

// Define database types
type DBFacility = {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  image_url?: string;
  owner_id: string;
  owner_email: string;
  operating_hours: {
    monday: { open: string; close: string } | null;
    tuesday: { open: string; close: string } | null;
    wednesday: { open: string; close: string } | null;
    thursday: { open: string; close: string } | null;
    friday: { open: string; close: string } | null;
    saturday: { open: string; close: string } | null;
    sunday: { open: string; close: string } | null;
  };
  price_per_hour: number;
  currency: string;
  sport_type: string[];
  amenities: string[];
};

type DBBooking = {
  id: string;
  facility_id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
};

/**
 * Page component for displaying a single facility with booking functionality
 */
export const dynamic = "force-dynamic";

export default async function FacilityDetailPage({ params }: Props) {
  // Important: We create the Supabase client here properly
  const supabase = await createServerSupabaseClient();
  const { id } = params;

  // Fetch specific facility by ID with type safety
  const { data: facility, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("id", id)
    .single<DBFacility>();

  if (error || !facility) {
    console.error("Error fetching facility:", error);
    notFound();
  }

  // Fetch existing bookings for this facility
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("facility_id", id)
    .in("status", ["confirmed", "pending"])
    .returns<DBBooking[]>();

  // Fetch open lobbies for this facility
  const { data: facilityLobbies, error: lobbiesError } = await supabase
    .from("lobbies")
    .select("*")
    .eq("facility_id", id)
    .eq("status", "open")
    .order("created_at", { ascending: true });

  if (lobbiesError) {
    console.error("Error fetching lobbies:", lobbiesError);
    // Continue anyway, we'll handle this gracefully in the component
  }

  // Convert DB structure to component-friendly structure that matches Facility type
  const formattedFacility: Facility = {
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
  };

  // Convert bookings to the expected format for booking form
  const formattedBookings = (existingBookings || []).map(
    (booking: { start_time: any; end_time: any; date: any }) => ({
      startTime: booking.start_time,
      endTime: booking.end_time,
      date: booking.date,
    })
  );

  return (
    <div>
      {/* Back to discover link */}
      <div className="mb-6">
        <Link
          href="/discover"
          className="text-primary-600 hover:underline inline-flex items-center"
        >
          ← Back to Discover
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Facility details - takes up 2/3 of the width on medium+ screens */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {formattedFacility.name}
            </h1>
            <p className="text-gray-600">
              {formattedFacility.address}, {formattedFacility.city},{" "}
              {formattedFacility.postal_code}
            </p>
          </div>

          {/* Facility image */}
          <div className="bg-gray-200 h-64 sm:h-96 rounded-lg flex items-center justify-center">
            {formattedFacility.imageUrl ? (
              <img
                src={formattedFacility.imageUrl}
                alt={formattedFacility.name}
                className="h-full w-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-gray-400">Facility Image</span>
            )}
          </div>

          {/* Facility description */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                About this facility
              </h2>
              <p className="text-gray-700 mb-6">
                {formattedFacility.description}
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Amenities */}
                <div>
                  <h3 className="font-medium mb-2">Amenities</h3>
                  {formattedFacility.amenities.length > 0 ? (
                    <ul className="space-y-1">
                      {formattedFacility.amenities.map((amenity) => (
                        <li
                          key={amenity}
                          className="flex items-center text-gray-700"
                        >
                          <svg
                            className="h-5 w-5 text-green-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {amenity}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No amenities listed</p>
                  )}
                </div>

                {/* Operating hours */}
                <div>
                  <h3 className="font-medium mb-2">Operating Hours</h3>
                  <ul className="space-y-1">
                    {[
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                      "sunday",
                    ].map((day) => (
                      <li
                        key={day}
                        className="flex justify-between text-gray-700"
                      >
                        <span className="capitalize">{day}:</span>
                        <span>
                          {formattedFacility.operatingHours[day]
                            ? `${formatTime(
                                formattedFacility.operatingHours[day].open
                              )} - ${formatTime(
                                formattedFacility.operatingHours[day].close
                              )}`
                            : "Closed"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Additional information card */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Additional Information
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Game tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {formattedFacility.sportType.map((sport) => (
                      <span
                        key={sport}
                        className="inline-block bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full"
                      >
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Price</h3>
                  <p className="text-gray-700">
                    <span className="text-2xl font-semibold text-primary-600">
                      {formatPrice(
                        formattedFacility.price_per_hour,
                        formattedFacility.currency
                      )}
                    </span>
                    <span className="text-gray-500"> / hour</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Owner Actions */}
          <FacilityOwnerActions
            facilityId={formattedFacility.id}
            ownerId={formattedFacility.owner_id}
          />
        </div>

        {/* Booking sidebar - takes up 1/3 of the width on medium+ screens */}
        <div>
          <Card className="sticky top-24">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Book this facility</h2>

              <Suspense fallback={<div>Loading booking form...</div>}>
                <BookingFormWrapper
                  facility={formattedFacility}
                  existingBookings={formattedBookings}
                />
              </Suspense>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
