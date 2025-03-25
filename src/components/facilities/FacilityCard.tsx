// src/components/facilities/FacilityCard.tsx
import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Facility } from '@/types/facility';
import { formatPrice } from '@/lib/utils';

type FacilityCardProps = {
  facility: Facility;
};

/**
 * Card component for displaying a facility in a list
 */
export function FacilityCard({ facility }: FacilityCardProps) {
  return (
    <Card className="h-full flex flex-col transition-shadow hover:shadow-md">
      {/* Facility image */}
      <div className="bg-gray-200 h-48 relative">
        {facility.image_url ? (
          <img 
            src={facility.image_url} 
            alt={facility.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image available
          </div>
        )}
      </div>
      
      {/* Facility details */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-semibold mb-1">{facility.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{facility.address}</p>
        
        {/* Sport types */}
        <div className="mb-3 flex flex-wrap gap-1">
          {facility.sport_type.map((sport) => (
            <span 
              key={sport} 
              className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded"
            >
              {sport.charAt(0).toUpperCase() + sport.slice(1)}
            </span>
          ))}
        </div>
        
        {/* Description (truncated) */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
          {facility.description}
        </p>
        
        {/* Price and booking button */}
        <div className="mt-auto flex justify-between items-center">
          <span className="font-medium text-primary-600">
            {formatPrice(facility.price_per_hour, facility.currency)}/hour
          </span>
          <Link href={`/facilities/${facility.id}`}>
            <Button variant="primary" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
