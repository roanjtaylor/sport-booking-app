// src/app/facilities/[id]/page.tsx
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { formatTime } from '@/lib/utils';
import { BookingForm } from '@/components/bookings/BookingForm';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { Database } from '@/types/supabase';

type Props = {
  params: { id: string };
}

type DBFacility = Database['public']['Tables']['facilities']['Row'];
type DBBooking = Database['public']['Tables']['bookings']['Row'];

interface Facility extends Omit<DBFacility, 'price_per_hour'> {
  price_per_hour: number;
  sport_type: string[];
  amenities: string[];
  operating_hours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
}

interface ExistingBooking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  facility_id: string;
  user_id: string;
}

/**
 * Page component for displaying a single facility with booking functionality
 */
export default async function FacilityDetailPage({ params }: Props) {
  const { id } = params;
  const supabase = await createServerSupabaseClient();
  
  // Fetch specific facility by ID with type safety
  const { data: facility, error } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', params.id)
    .single<DBFacility>();

  if (error || !facility) {
    console.error('Error fetching facility:', error);
    return notFound();
  }

  // Fetch existing bookings for this facility with type safety
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('facility_id', params.id)
    .in('status', ['confirmed', 'pending'])
    .returns<DBBooking[]>();

  // Format the facility data to match the Facility interface
  const formattedFacility: Facility = {
    ...facility,
    sport_type: Array.isArray(facility.sport_type) ? facility.sport_type : [],
    price_per_hour: Number(facility.price_per_hour),
    amenities: facility.amenities ?? [],
    operating_hours: typeof facility.operating_hours === 'object' && facility.operating_hours !== null
      ? Object.fromEntries(
          Object.entries(facility.operating_hours).map(([day, hours]) => [
            day,
            typeof hours === 'object' && hours !== null && 'open' in hours && 'close' in hours
              ? { open: String(hours.open), close: String(hours.close) }
              : { open: '', close: '' },
          ])
        )
      : {}
  };

  // Format the bookings data to match the ExistingBooking interface
  const formattedBookings: ExistingBooking[] = (existingBookings ?? []).map(booking => ({
    id: booking.id,
    date: booking.date,
    start_time: booking.start_time,
    end_time: booking.end_time,
    status: booking.status as 'pending' | 'confirmed' | 'cancelled',
    facility_id: booking.facility_id,
    user_id: booking.user_id
  }));

  return (
    <div>
      {/* Back to facilities link */}
      <div className="mb-6">
        <Link href="/facilities" className="text-primary-600 hover:underline inline-flex items-center">
          ← Back to Facilities
        </Link>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {/* Facility details - takes up 2/3 of the width on medium+ screens */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{facility.name}</h1>
            <p className="text-gray-600">{facility.address}, {facility.city}, {facility.postal_code}</p>
          </div>
          
          {/* Facility image */}
          <div className="bg-gray-200 h-64 sm:h-96 rounded-lg flex items-center justify-center">
            {facility.image_url ? (
              <img 
                src={facility.image_url} 
                alt={facility.name} 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-gray-400">Facility Image</span>
            )}
          </div>
          
          {/* Facility description */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">About this facility</h2>
              <p className="text-gray-700 mb-6">{facility.description}</p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Amenities */}
                <div>
                  <h3 className="font-medium mb-2">Amenities</h3>
                  <ul className="space-y-1">
                    {facility.amenities && facility.amenities.map((amenity) => (
                      <li key={amenity} className="flex items-center text-gray-700">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {amenity}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Operating hours */}
                <div>
                  <h3 className="font-medium mb-2">Operating Hours</h3>
                  <ul className="space-y-1">
                    {facility.operating_hours && Object.entries(facility.operating_hours).map(([day, hours]) => (
                      <li key={day} className="flex justify-between text-gray-700">
                        <span className="capitalize">{day}:</span>
                        <span>
                          {hours && hours.open
                            ? `${formatTime(hours.open)} - ${formatTime(hours.close)}`
                            : 'Closed'
                          }
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
              <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Sport Types</h3>
                  <div className="flex flex-wrap gap-1">
                    {facility.sport_type && facility.sport_type.map((sport) => (
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
                      ${facility.price_per_hour}
                    </span>
                    <span className="text-gray-500"> / hour</span>
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Location</h3>
                  <div className="bg-gray-200 h-48 rounded flex items-center justify-center">
                    <span className="text-gray-400">Map would go here</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Booking sidebar - takes up 1/3 of the width on medium+ screens */}
        <div>
        <BookingForm 
          facility={formattedFacility} 
          existingBookings={formattedBookings} 
        />
        </div>
      </div>
    </div>
  );
}