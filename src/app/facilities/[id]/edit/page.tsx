// src/app/facilities/[id]/edit/page.tsx
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { FacilityForm } from '@/components/facilities/FacilityForm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface PageProps {
  params: {
    id: string;
  };
}

/**
 * Page component for editing an existing facility
 */
export const dynamic = 'force-dynamic';

export default async function EditFacilityPage({ params }: PageProps) {
  const { id } = params;
  
  // Create supabase client correctly for server components
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch the facility data - do this before checking user to handle not found
  const { data: facility, error } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !facility) {
    console.error('Error fetching facility:', error);
    notFound();
  }
  
  // Now check authentication - allow the page to load but handle permissions in the form
  if (!user) {
    // Redirect to login if not authenticated
    return redirect(`/auth/login?redirect=/facilities/${id}/edit`);
  }
  
  // Convert DB structure to component-friendly structure
  const formattedFacility = {
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
  };

  return (
    <div>
      <div className="mb-8">
        <Link 
          href={`/facilities/${id}`} 
          className="text-primary-600 hover:underline inline-flex items-center mb-4"
        >
          ← Back to Facility
        </Link>
        <h1 className="text-3xl font-bold mb-2">Edit Facility</h1>
        <p className="text-gray-600">
          Update your facility information below.
        </p>
      </div>
      
      {/* Pass the facility data and owner check to the form component */}
      <FacilityForm 
        facility={formattedFacility} 
        isEdit={true} 
        isOwner={user.id === facility.owner_id}
      />
    </div>
  );
}