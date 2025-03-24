// src/app/facilities/[id]/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatTime } from '@/lib/utils';

/**
 * Page component for displaying a single facility with booking functionality
 * In a real application, this would fetch data from Supabase based on the ID
 */
export default function FacilityDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  // Mock facility data - would come from a database in production
  const facility = {
    id,
    name: 'Downtown Football Field',
    description: 'A well-maintained football field in the heart of downtown. Perfect for 5-a-side or 7-a-side games. The field features high-quality artificial turf, floodlights for evening games, and changing facilities with showers.',
    address: '123 Main St, City',
    city: 'Metropolis',
    postalCode: '12345',
    country: 'United States',
    pricePerHour: 30,
    currency: 'USD',
    sportType: ['football'],
    amenities: [
      'Floodlights',
      'Changing Rooms',
      'Showers',
      'Parking',
      'Equipment Rental',
    ],
    operatingHours: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '22:00' },
      saturday: { open: '10:00', close: '20:00' },
      sunday: { open: '10:00', close: '18:00' },
    },
  };

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
            <p className="text-gray-600">{facility.address}, {facility.city}, {facility.postalCode}</p>
          </div>
          
          {/* Facility image */}
          <div className="bg-gray-200 h-64 sm:h-96 rounded-lg flex items-center justify-center">
            <span className="text-gray-400">Facility Image</span>
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
                    {facility.amenities.map((amenity) => (
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
                    {Object.entries(facility.operatingHours).map(([day, hours]) => (
                      <li key={day} className="flex justify-between text-gray-700">
                        <span className="capitalize">{day}:</span>
                        <span>
                          {hours
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
                    {facility.sportType.map((sport) => (
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
                      ${facility.pricePerHour}
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
          <Card className="sticky top-24">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Book this facility</h2>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    min={new Date().toISOString().split('T')[0]} // Today's date
                  />
                </div>
                
                {/* Time slot selection would be more interactive in a real app */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00'].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className="p-2 border border-gray-300 rounded text-center text-sm hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="Any special requests"
                    className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                  ></textarea>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Price per hour</span>
                    <span>${facility.pricePerHour}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>${facility.pricePerHour}</span>
                  </div>
                </div>
                
                <Button type="submit" fullWidth>
                  Proceed to Book
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
