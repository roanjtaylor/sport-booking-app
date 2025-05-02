"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import { OnboardingTimeline } from "@/components/onboarding/OnboardingTimeline";
import { formatPrice } from "@/lib/utils";
import { Facility } from "@/types/facility";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { authApi, facilitiesApi } from "@/lib/api"; // Import from the API layer

/**
 * Home page component with improved onboarding experience
 */
export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated and redirect to dashboard if so
  useEffect(() => {
    async function checkAuth() {
      try {
        // Use the API layer to get current user
        const { data: user, error: userError } = await authApi.getCurrentUser();

        if (userError) {
          console.error("Error checking auth status:", userError);
        }

        if (user) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  // Fetch featured facilities from database
  useEffect(() => {
    async function fetchFeaturedFacilities() {
      try {
        setFacilitiesLoading(true);

        // Use the API layer to get all facilities
        const { data, error: facilitiesError } =
          await facilitiesApi.getAllFacilities();

        if (facilitiesError) {
          throw facilitiesError;
        }

        // Take the first 3 facilities as featured
        setFacilities(data?.slice(0, 3) || []);
      } catch (err) {
        console.error("Error fetching facilities:", err);
        setError("Failed to load facilities");
      } finally {
        setFacilitiesLoading(false);
      }
    }

    fetchFeaturedFacilities();
  }, []);

  // Timeline steps for the onboarding process
  const timelineSteps = [
    {
      title: "SportBooking",
      description: "Empowering everyone to enjoy their favourite sport.",
      imageType: "browse",
    },
    {
      title: "Book or Join a Lobby",
      description:
        "Book a full facility for your team, or join a lobby with other available players!",
      imageType: "book",
    },
    {
      title: "Play & Enjoy",
      description:
        "Just show up for your booking at the correct time. We'll handle the rest.",
      imageType: "play",
    },
    {
      title: "Get Started Now",
      description:
        "Ready to dive into what you enjoy? Browse facilities, log in, or create an account.",
      imageType: "start",
    },
  ];

  // If still checking auth status, show loading indicator
  if (isLoading) {
    return (
      <LoadingIndicator
        message="" // Empty message to hide the text
        className="min-h-screen p-0" // Override padding and set full height
      />
    );
  }

  return (
    <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Full-screen hero section with interactive timeline (no padding) */}
      <section className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 pb-16">
        {/* Interactive onboarding timeline */}
        <OnboardingTimeline steps={timelineSteps} />
      </section>
      {/* Rest of content with normal padding */}
      <div className="px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Featured facilities section */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Facilities</h2>
            <Link
              href="/discover"
              className="text-primary-600 hover:text-primary-700"
            >
              View All →
            </Link>
          </div>

          {facilitiesLoading ? (
            // Loading state for facilities
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((placeholder) => (
                <Card key={placeholder} className="animate-pulse">
                  <div className="bg-gray-200 h-48"></div>
                  <div className="p-4">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
          ) : facilities.length === 0 ? (
            // Empty state
            <div className="text-center py-10">
              <p className="text-gray-500">
                No facilities found. Check back soon!
              </p>
            </div>
          ) : (
            // Display actual facilities from database
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((facility) => (
                <Card
                  key={facility.id}
                  className="transition-shadow hover:shadow-lg"
                >
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
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-1">
                      {facility.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
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

                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {facility.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600 font-medium">
                        {formatPrice(
                          facility.price_per_hour,
                          facility.currency
                        )}
                        /hour
                      </span>
                      <Link href={`/facilities/${facility.id}`}>
                        <Button variant="primary" size="sm">
                          Book Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Testimonials section */}
        <section className="bg-gray-50 p-8 rounded-lg">
          <h2 className="text-3xl font-bold text-center mb-8">
            What Our Users Say
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote:
                  "This platform has made booking football pitches so much easier. No more phone calls or visiting in person!",
                name: "John Doe",
                title: "Example Reviewer",
              },
              {
                quote:
                  "As a facility owner, I've seen a 30% increase in bookings since joining this platform. Highly recommended!",
                name: "Jane Smith",
                title: "Example Reviewer",
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-700 italic mb-4">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-300 mr-3"></div>
                  <div>
                    <h4 className="font-medium">{testimonial.name}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
