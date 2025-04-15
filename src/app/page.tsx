"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import { OnboardingTimeline } from "@/components/onboarding/OnboardingTimeline";
import { supabase } from "@/lib/supabase";

/**
 * Home page component with improved onboarding experience
 */
export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated and redirect to dashboard if so
  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {" "}
      {/* Remove default padding */}
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
              href="/facilities"
              className="text-primary-600 hover:text-primary-700"
            >
              View All →
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: 1,
                name: "Downtown Football Field",
                address: "123 Main St, City",
                description:
                  "A well-maintained football field in the heart of downtown.",
                price: 30,
              },
              {
                id: 2,
                name: "Westside Tennis Courts",
                address: "456 Park Ave, City",
                description:
                  "Professional tennis courts with excellent lighting and facilities.",
                price: 25,
              },
              {
                id: 3,
                name: "Eastside Basketball Court",
                address: "789 Oak St, City",
                description:
                  "Indoor basketball court with high-quality flooring and equipment.",
                price: 20,
              },
            ].map((facility) => (
              <Card
                key={facility.id}
                className="transition-shadow hover:shadow-lg"
              >
                <div className="bg-gray-200 h-48 flex items-center justify-center">
                  <span className="text-gray-400">Facility Image</span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1">
                    {facility.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {facility.address}
                  </p>
                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                    {facility.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-primary-600 font-medium">
                      £{facility.price}/hour
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
                name: "Alex Johnson",
                title: "Football Team Captain",
              },
              {
                quote:
                  "As a facility owner, I've seen a 30% increase in bookings since joining this platform. Highly recommended!",
                name: "Sarah Lee",
                title: "Sports Center Owner",
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
