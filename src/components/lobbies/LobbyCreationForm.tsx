// src/components/lobbies/LobbyCreationForm.tsx
import React from "react";
import { Button } from "@/components/ui/Button";
import { TimeSlot } from "@/types/booking";
import { TimeSlotPicker } from "@/components/facilities/TimeSlotPicker";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { NotesField } from "@/components/ui/NotesField";
import { BookingSummary } from "@/components/bookings/BookingSummary";

interface LobbyCreationFormProps {
  date: string;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  timeSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  initialGroupSize: number;
  onInitialGroupSizeChange: (value: number) => void;
  groupName: string;
  onGroupNameChange: (value: string) => void;
  notes: string;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  facility: any;
  minPlayers: number;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  minDate: string;
  maxDate: string;
}

/**
 * Form component for creating a new lobby
 */
export function LobbyCreationForm({
  date,
  onDateChange,
  timeSlots,
  selectedSlot,
  onSelectSlot,
  initialGroupSize,
  onInitialGroupSizeChange,
  groupName,
  onGroupNameChange,
  notes,
  onNotesChange,
  facility,
  minPlayers,
  onSubmit,
  onCancel,
  isLoading,
  minDate,
  maxDate,
}: LobbyCreationFormProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Create New Lobby</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Date selection */}
        <DatePickerField
          label="Date"
          id="lobby-date"
          value={date}
          onChange={onDateChange}
          minDate={minDate}
          maxDate={maxDate}
          required
        />

        {/* Time slot selection */}
        {date && (
          <TimeSlotPicker
            timeSlots={timeSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={onSelectSlot}
          />
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            How many players do you already have?
          </label>
          <input
            type="number"
            min="1"
            max={minPlayers - 1}
            value={initialGroupSize}
            onChange={(e) => onInitialGroupSizeChange(parseInt(e.target.value))}
            className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Include yourself and friends who are committed to playing
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group Name (optional)
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => onGroupNameChange(e.target.value)}
            placeholder="e.g. 'Tuesday Regulars'"
            className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Notes field */}
        {selectedSlot && (
          <NotesField
            label="Notes for other players (optional)"
            id="lobby-notes"
            value={notes}
            onChange={onNotesChange}
            placeholder="Any details for others joining your lobby"
          />
        )}

        {/* Lobby summary */}
        {selectedSlot && (
          <BookingSummary
            facilityName={facility.name}
            date={date}
            selectedSlot={selectedSlot}
            price={facility.price_per_hour}
            currency={facility.currency}
            playersNeeded={minPlayers}
            isLobby={true}
          />
        )}

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !selectedSlot}>
            {isLoading ? "Creating..." : "Create Lobby"}
          </Button>
        </div>
      </form>
    </div>
  );
}
