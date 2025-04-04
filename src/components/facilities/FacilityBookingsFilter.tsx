// components/facilities/FacilityBookingsFilter.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface FacilityBookingsFilterProps {
  facilities: { id: string; name: string }[];
  onFilter: (filters: {
    facilityId: string;
    status: string;
    dateRange: string;
  }) => void;
}

export function FacilityBookingsFilter({ facilities, onFilter }: FacilityBookingsFilterProps) {
  const [facilityId, setFacilityId] = useState('');
  const [status, setStatus] = useState('');
  const [dateRange, setDateRange] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({
      facilityId,
      status,
      dateRange
    });
  };
  
  const handleReset = () => {
    setFacilityId('');
    setStatus('');
    setDateRange('');
    
    onFilter({
      facilityId: '',
      status: '',
      dateRange: ''
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          <select 
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
          >
            <option value="">All Facilities</option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select 
            className="p-2 border border-gray-300 rounded-md bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <select 
            className="p-2 border border-gray-300 rounded-md bg-white"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
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