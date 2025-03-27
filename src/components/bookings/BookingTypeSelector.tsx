// src/components/bookings/BookingTypeSelector.tsx
"use client";

import React from 'react';
import { Card } from '@/components/ui/Card';

export type BookingType = 'full' | 'lobby';

type BookingTypeSelectorProps = {
  selectedType: BookingType;
  onChange: (type: BookingType) => void;
  minPlayers?: number;
};

/**
 * Component for selecting between a full booking or joining/creating a lobby
 */
export function BookingTypeSelector({ 
  selectedType, 
  onChange, 
  minPlayers = 10 
}: BookingTypeSelectorProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium mb-3">Select Booking Type</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Full Booking Option */}
        <Card 
          className={`overflow-hidden cursor-pointer transition ${
            selectedType === 'full' 
              ? 'ring-2 ring-primary-500' 
              : 'hover:shadow-md'
          }`}
          onClick={() => onChange('full')}
        >
          <div className="p-4">
            <div className="flex items-center mb-2">
              <div className={`w-5 h-5 rounded-full border ${
                selectedType === 'full' 
                  ? 'border-primary-500 bg-primary-500' 
                  : 'border-gray-300'
              } mr-3`}>
                {selectedType === 'full' && (
                  <div className="w-2 h-2 bg-white rounded-full m-1.5"></div>
                )}
              </div>
              <h3 className="font-medium">Full Booking</h3>
            </div>
            <p className="text-sm text-gray-600 ml-8">
              Book the entire facility for your group. You're responsible for all players and the full cost.
            </p>
          </div>
        </Card>
        
        {/* Lobby Option */}
        <Card 
          className={`overflow-hidden cursor-pointer transition ${
            selectedType === 'lobby' 
              ? 'ring-2 ring-primary-500' 
              : 'hover:shadow-md'
          }`}
          onClick={() => onChange('lobby')}
        >
          <div className="p-4">
            <div className="flex items-center mb-2">
              <div className={`w-5 h-5 rounded-full border ${
                selectedType === 'lobby' 
                  ? 'border-primary-500 bg-primary-500' 
                  : 'border-gray-300'
              } mr-3`}>
                {selectedType === 'lobby' && (
                  <div className="w-2 h-2 bg-white rounded-full m-1.5"></div>
                )}
              </div>
              <h3 className="font-medium">Join a Lobby</h3>
            </div>
            <p className="text-sm text-gray-600 ml-8">
              Join an existing lobby or create a new one. Booking will be confirmed once {minPlayers} players join.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}