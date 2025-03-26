// src/app/facilities/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import FacilitiesClient from './FacilitiesClient';
import { Facility } from '@/types/facility';

/**
 * Page component for listing all facilities
 */
export const dynamic = 'force-dynamic';

export default async function FacilitiesListPage() {
  const supabase = await createServerSupabaseClient();
  
  // Fetch facilities from Supabase
  const { data: facilities, error } = await supabase
    .from('facilities')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching facilities:', error);
    // Handle error state - we'll pass an empty array to the client component
  }

  // Convert to our Facility type
  const formattedFacilities: Facility[] = (facilities || []).map(facility => ({
    id: facility.id,
    name: facility.name,
    description: facility.description,
    address: facility.address,
    city: facility.city,
    postal_code: facility.postal_code,
    country: facility.country,
    imageUrl: facility.image_url,
    owner_id: facility.owner_id,
    operatingHours: facility.operating_hours,
    price_per_hour: facility.price_per_hour,
    currency: facility.currency,
    sportType: facility.sport_type,
    amenities: facility.amenities || [],
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sports Facilities</h1>
        <p className="text-gray-600">
          Browse and book sports facilities in your area.
        </p>
      </div>
      
      {/* Pass the facilities to the client component for filtering */}
      <FacilitiesClient initialFacilities={formattedFacilities} />
      
      {/* For facility owners - CTA */}
      <div className="mt-12 bg-primary-50 p-6 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-2">Own a Sports Facility?</h2>
        <p className="text-gray-700 mb-4">
          List your facility on our platform and reach more customers.
        </p>
        <Link href="/facilities/add">
          <Button>Add Your Facility</Button>
        </Link>
      </div>
    </div>
  );
}