// src/app/facilities/page.tsx
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/**
 * Page component for listing all facilities
 * In a real application, this would fetch data from Supabase
 */
export default function FacilitiesListPage() {
  // Mock facilities data - would come from a database in production
  const facilities = [
    {
      id: '1',
      name: 'Downtown Football Field',
      address: '123 Main St, City',
      description: 'A well-maintained football field in the heart of downtown.',
      pricePerHour: 30,
      sportType: ['football'],
      currency: 'USD',
    },
    {
      id: '2',
      name: 'Westside Tennis Courts',
      address: '456 Park Ave, City',
      description: 'Professional tennis courts with excellent lighting and facilities.',
      pricePerHour: 25,
      sportType: ['tennis'],
      currency: 'USD',
    },
    {
      id: '3',
      name: 'Eastside Basketball Court',
      address: '789 Oak St, City',
      description: 'Indoor basketball court with high-quality flooring and equipment.',
      pricePerHour: 20,
      sportType: ['basketball'],
      currency: 'USD',
    },
    {
      id: '4',
      name: 'Central Sports Complex',
      address: '101 Center Blvd, City',
      description: 'Multi-purpose sports facility with football, basketball, and tennis options.',
      pricePerHour: 35,
      sportType: ['football', 'basketball', 'tennis'],
      currency: 'USD',
    },
    {
      id: '5',
      name: 'Northside Indoor Soccer',
      address: '202 North St, City',
      description: 'Indoor soccer facility with artificial turf and full-size goals.',
      pricePerHour: 40,
      sportType: ['football'],
      currency: 'USD',
    },
    {
      id: '6',
      name: 'Riverside Volleyball Courts',
      address: '303 River Rd, City',
      description: 'Beach volleyball courts located near the riverside with shower facilities.',
      pricePerHour: 15,
      sportType: ['volleyball'],
      currency: 'USD',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sports Facilities</h1>
        <p className="text-gray-600">
          Browse and book sports facilities in your area.
        </p>
      </div>
      
      {/* Search and filter controls */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Search for facilities..."
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex gap-2">
            <select className="p-2 border border-gray-300 rounded-md bg-white">
              <option value="">All Sports</option>
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
              <option value="tennis">Tennis</option>
              <option value="volleyball">Volleyball</option>
              <option value="badminton">Badminton</option>
            </select>
            <select className="p-2 border border-gray-300 rounded-md bg-white">
              <option value="">Price: Any</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
            <Button variant="primary" size="sm">
              Filter
            </Button>
          </div>
        </div>
      </div>
      
      {/* Facilities grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities.map((facility) => (
          <Card key={facility.id} className="h-full flex flex-col transition-shadow hover:shadow-lg">
            {/* Facility image placeholder */}
            <div className="bg-gray-200 h-48 flex items-center justify-center">
              <span className="text-gray-400">Facility Image</span>
            </div>
            
            <div className="p-4 flex-grow flex flex-col">
              <h3 className="text-lg font-semibold mb-1">{facility.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{facility.address}</p>
              
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
              
              {/* Description */}
              <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                {facility.description}
              </p>
              
              {/* Price and booking button */}
              <div className="mt-auto flex justify-between items-center">
                <span className="font-medium text-primary-600">
                  ${facility.pricePerHour}/hour
                </span>
                <Link href={`/facilities/${facility.id}`}>
                  <Button variant="primary" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
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
