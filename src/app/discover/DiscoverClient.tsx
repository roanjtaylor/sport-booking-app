"use client";

// src/app/discover/DiscoverClient.tsx
import { useState } from "react";
import ListView from "@/components/discover/ListView";
import MapView from "@/components/discover/MapView";
import CalendarView from "@/components/discover/CalendarView";

// Tab type definition for type safety
type TabType = "list" | "map" | "calendar";

/**
 * Client component for the Discover page
 * Manages tab state and renders the appropriate view
 */
export default function DiscoverClient() {
  // State to track the currently active tab
  const [activeTab, setActiveTab] = useState<TabType>("list");

  // Function to render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "list":
        return <ListView />;
      case "map":
        return <MapView />;
      case "calendar":
        return <CalendarView />;
      default:
        return <ListView />;
    }
  };

  return (
    <div>
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
