// src/components/facilities/FacilityFilters.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface FacilityFiltersProps {
  onFilter: (filters: {
    search: string;
    sportType: string;
    priceSort: string;
  }) => void;
  sportTypes: string[];
}

export function FacilityFilters({ onFilter, sportTypes }: FacilityFiltersProps) {
  const [search, setSearch] = useState('');
  const [selectedSportType, setSelectedSportType] = useState('');
  const [priceSort, setPriceSort] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({
      search,
      sportType: selectedSportType,
      priceSort
    });
  };
  
  const handleReset = () => {
    setSearch('');
    setSelectedSportType('');
    setPriceSort('');
    
    onFilter({
      search: '',
      sportType: '',
      priceSort: ''
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search for facilities..."
            className="w-full p-2 border border-gray-300 rounded-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select 
            className="p-2 border border-gray-300 rounded-md bg-white"
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
            className="p-2 border border-gray-300 rounded-md bg-white"
            value={priceSort}
            onChange={(e) => setPriceSort(e.target.value)}
          >
            <option value="">Price: Any</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              Filter
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}