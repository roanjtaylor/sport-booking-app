// src/app/bookings/[id]/page.tsx - Refactored
import { Suspense } from "react";
import BookingDetailClient from "./BookingDetailClient";
import { notFound } from "next/navigation";
import { DetailLayout } from "@/components/layouts";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Server component for the booking detail page
 */
export default async function BookingDetailPage({ params }: PageProps) {
  // Wait for params to be available
  const resolvedParams = await params;
  const bookingId = resolvedParams.id;

  if (!bookingId) {
    notFound();
  }

  return (
    <DetailLayout
      title="Booking Details"
      backLink="/bookings"
      backText="Back to Bookings"
    >
      <Suspense
        fallback={
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
              <p className="mt-4 text-gray-600">Loading booking details...</p>
            </div>
          </div>
        }
      >
        <BookingDetailClient id={bookingId} />
      </Suspense>
    </DetailLayout>
  );
}
