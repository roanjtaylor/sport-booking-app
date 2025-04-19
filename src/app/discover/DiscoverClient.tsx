// src/app/discover/DiscoverClient.tsx
"use client";

import { useState } from "react";
import ListView from "@/components/discover/ListView";
import MapView from "@/components/discover/MapView";
import CalendarView from "@/components/discover/CalendarView";
import { ModeSelectionScreen } from "@/components/discover/ModeSelectionScreen";
import { useRouter, useSearchParams } from "next/navigation";

// Tab type definition for type safety
type TabType = "list" | "map" | "calendar";
type BookingMode = "booking" | "lobby" | null;

/**
 * Client component for the Discover page
 * Now includes initial mode selection between booking and lobby
 */
export default function DiscoverClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get mode from URL if available
  const modeParam = searchParams.get("mode") as BookingMode;

  // State to track the booking mode and currently active tab
  const [mode, setMode] = useState<BookingMode>(modeParam);
  const [activeTab, setActiveTab] = useState<TabType>("list");

  // Handle mode selection
  const handleModeSelect = (selectedMode: BookingMode) => {
    setMode(selectedMode);

    // Update URL to reflect the selected mode
    const url = new URL(window.location.href);
    url.searchParams.set("mode", selectedMode || "");
    router.push(url.pathname + url.search);
  };

  // Function to render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "list":
        return <ListView mode={mode} />;
      case "map":
        return <MapView mode={mode} />;
      case "calendar":
        return <CalendarView mode={mode} />;
      default:
        return <ListView mode={mode} />;
    }
  };

  // If no mode is selected yet, show the mode selection screen
  if (!mode) {
    return <ModeSelectionScreen onModeSelect={handleModeSelect} />;
  }

  return (
    <div>
      {/* Mode indicator */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {mode === "booking" ? "Browse Facilities" : "Find Lobbies"}
        </h2>
        <button
          onClick={() => handleModeSelect(null)}
          className="text-primary-600 hover:text-primary-800 text-sm"
        >
          Change Mode
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("list")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "list"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            aria-current={activeTab === "list" ? "page" : undefined}
          >
            List View
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "map"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            aria-current={activeTab === "map" ? "page" : undefined}
          >
            Map View
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "calendar"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            aria-current={activeTab === "calendar" ? "page" : undefined}
          >
            Calendar View
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">{renderTabContent()}</div>
    </div>
  );
}
