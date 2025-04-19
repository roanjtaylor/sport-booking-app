// src/components/discover/ModeSelectionScreen.tsx
"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

type BookingMode = "booking" | "lobby";

interface ModeSelectionScreenProps {
  onModeSelect: (mode: BookingMode) => void;
}

export function ModeSelectionScreen({
  onModeSelect,
}: ModeSelectionScreenProps) {
  return (
    <div className="py-10">
      <h2 className="text-2xl font-bold mb-8 text-center">
        What would you like to do today?
      </h2>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Booking Option */}
        <Card
          className="p-8 hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center text-center h-full border-2 border-transparent hover:border-primary-500"
          onClick={() => onModeSelect("booking")}
        >
          <div className="h-24 w-24 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Full Booking</h3>
          <p className="text-gray-600 mb-6">
            Book an entire facility for yourself or your team. You'll have
            exclusive access for your timeslot.
          </p>
          <div className="mt-auto pt-4">
            <button className="btn-primary py-2 px-6 rounded-md">
              Select This Option
            </button>
          </div>
        </Card>

        {/* Lobby Option */}
        <Card
          className="p-8 hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center text-center h-full border-2 border-transparent hover:border-primary-500"
          onClick={() => onModeSelect("lobby")}
        >
          <div className="h-24 w-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Join a Lobby</h3>
          <p className="text-gray-600 mb-6">
            Find or create a lobby to play with others. Split the cost and meet
            new people who enjoy the same sports.
          </p>
          <div className="mt-auto pt-4">
            <button className="btn-primary py-2 px-6 rounded-md">
              Select This Option
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
