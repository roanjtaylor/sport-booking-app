// src/app/bookings/[id]/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import BookingDetailClient from './BookingDetailClient';
import { notFound } from 'next/navigation';

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
    <div>
      <div className="mb-8">
        <Link 
          href="/bookings" 
          className="text-primary-600 hover:underline inline-flex items-center"
        >
          ← Back to Bookings
        </Link>
        <h1 className="text-3xl font-bold mt-2">Booking Details</h1>
      </div>
      
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
    </div>
  );
}