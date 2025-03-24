// src/components/facilities/TimeSlotPicker.tsx
import React from 'react';
import { formatTime } from '@/lib/utils';
import { TimeSlot } from '@/types/booking';

type TimeSlotPickerProps = {
  timeSlots: TimeSlot[];
  selectedSlot?: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
};

/**
 * Time slot picker component for booking a facility
 */
export function TimeSlotPicker({ 
  timeSlots, 
  selectedSlot, 
  onSelectSlot 
}: TimeSlotPickerProps) {
  return (
    <div className="mt-4">
      <h3 className="font-medium mb-2">Available Time Slots</h3>
      
      {timeSlots.length === 0 ? (
        <p className="text-gray-500">No available time slots for this day.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {timeSlots.map((slot, index) => (
            <button
              key={index}
              type="button"
              disabled={!slot.available}
              onClick={() => slot.available && onSelectSlot(slot)}
              className={`p-2 rounded text-sm text-center ${
                !slot.available
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : selectedSlot?.startTime === slot.startTime
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-500'
              }`}
            >
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
