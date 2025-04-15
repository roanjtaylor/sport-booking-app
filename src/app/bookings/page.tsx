// src/app/bookings/page.tsx
import { Suspense } from "react";
import BookingsClient from "./BookingsClient";
import { Card } from "@/components/ui/Card";

/**
 * Server component for the bookings page
 * Uses a client component for data fetching and interactivity
 */
export default function BookingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-gray-600">
          Manage all your facility bookings in one place
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your bookings...</p>
            </div>
          </div>
        }
      >
        <BookingsClient />
      </Suspense>
    </div>
  );
}
