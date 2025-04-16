// src/components/lobbies/LobbyFilters.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface LobbyFiltersProps {
  onFilter: (filters: {
    search: string;
    sportType: string;
    dateRange: string;
  }) => void;
  sportTypes: string[];
}

export function LobbyFilters({ onFilter, sportTypes }: LobbyFiltersProps) {
  const [search, setSearch] = useState("");
  const [selectedSportType, setSelectedSportType] = useState("");
  const [dateRange, setDateRange] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({
      search,
      sportType: selectedSportType,
      dateRange,
    });
  };

  const handleReset = () => {
    setSearch("");
    setSelectedSportType("");
    setDateRange("");

    onFilter({
      search: "",
      sportType: "",
      dateRange: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search facilities..."
            className="w-full p-2 border border-gray-300 rounded-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="p-2 border border-gray-300 rounded-md bg-white w-full sm:w-36"
            value={selectedSportType}
            onChange={(e) => setSelectedSportType(e.target.value)}
          >
            <option value="">All Sports</option>
            {sportTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <select
            className="p-2 border border-gray-300 rounded-md bg-white w-full sm:w-36"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="">Any Date</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="week">This Week</option>
          </select>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              Filter
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
