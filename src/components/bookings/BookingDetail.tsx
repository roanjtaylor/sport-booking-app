// src/components/bookings/BookingDetail.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate, formatTime, formatPrice } from '@/lib/utils';
import { Booking } from '@/types/booking';

interface BookingDetailProps {
  booking: Booking;
  isOwner: boolean;
  onCancelBooking?: () => void;
  onConfirmBooking?: () => void;
  isProcessing: boolean;
}

/**
 * Component for displaying detailed booking information
 */
export function BookingDetail({
  booking,
  isOwner,
  onCancelBooking,
  onConfirmBooking,
  isProcessing
}: BookingDetailProps) {
  // Helper function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Booking Details
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Booking information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Booking Information</h4>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Booking ID</dt>
                <dd className="mt-1 text-gray-900">{booking.id}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Date</dt>
                <dd className="mt-1 text-gray-900">{formatDate(booking.date)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Time</dt>
                <dd className="mt-1 text-gray-900">
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Price</dt>
                <dd className="mt-1 text-gray-900">
                  {formatPrice(booking.total_price, booking.facility?.currency || 'GBP')}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Booking Date</dt>
                <dd className="mt-1 text-gray-900">{formatDate(booking.created_at)}</dd>
              </div>
            </dl>
          </div>
          
          {/* Facility information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Facility Information</h4>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="mt-1 text-gray-900">{booking.facility?.name || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="mt-1 text-gray-900">
                {booking.facility ? booking.facility.address : 'N/A'}, {booking.facility ? booking.facility.city : 'N/A'},{booking.facility ? booking.facility.postal_code : 'N/A'}
                </dd>
              </div>
              <div>
  <dt className="text-gray-500">Contact</dt>
  <dd className="mt-1 text-gray-900">
    {booking.facility?.owner_email || 'Contact information not available'}
  </dd>
</div>
              <div>
                <dt className="text-gray-500">Game tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                {booking.facility?.sport_type ? 
                    booking.facility.sport_type.map((sport: string) => (
                      <span 
                        key={sport} 
                        className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </span>
                    )) : 
                    booking.facility?.sportType?.map((sport: string) => (
                      <span 
                        key={sport} 
                        className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </span>
                    ))
                  }
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <Link href="/bookings">
            <Button variant="secondary">
              Back to Bookings
            </Button>
          </Link>
          
          {booking.status === 'pending' && (
            <>
              {isOwner && onConfirmBooking && (
                <Button onClick={onConfirmBooking} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Confirm Booking'}
                </Button>
              )}
              
              {onCancelBooking && (
                <Button variant="danger" onClick={onCancelBooking} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Cancel Booking'}
                </Button>
              )}
            </>
          )}
          
          {booking.status === 'confirmed' && (
            <Link href={`/facilities/${booking.facility_id}`}>
              <Button>
                Book Again
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
