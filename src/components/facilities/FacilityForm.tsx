// src/components/facilities/FacilityForm.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { OperatingHours, SportType, Facility } from '@/types/facility';
import { supabase } from '@/lib/supabase';

type FacilityFormProps = {
  facility?: Partial<Facility>;
  isEdit?: boolean;
};

/**
 * Form for creating or editing a facility
 */
export function FacilityForm({ facility, isEdit = false }: FacilityFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState(facility?.name || '');
  const [description, setDescription] = useState(facility?.description || '');
  const [address, setAddress] = useState(facility?.address || '');
  const [city, setCity] = useState(facility?.city || '');
  const [postalCode, setPostalCode] = useState(facility?.postalCode || '');
  const [country, setCountry] = useState(facility?.country || '');
  const [pricePerHour, setPricePerHour] = useState(facility?.pricePerHour?.toString() || '');
  const [currency, setCurrency] = useState(facility?.currency || 'USD');
  const [sportTypes, setSportTypes] = useState<SportType[]>(facility?.sportType || []);
  const [amenities, setAmenities] = useState<string[]>(facility?.amenities || []);
  
  // Operating hours state
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(
    facility?.operatingHours || {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: null,
    }
  );
  
  // Handle operating hours changes
  const handleOperatingHourChange = (
    day: keyof OperatingHours,
    field: 'open' | 'close',
    value: string
  ) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: prev[day] ? { ...(prev[day] || {}), [field]: value } : null,
    }));
  };
  
  // Toggle a day being open or closed
  const toggleDayOpen = (day: keyof OperatingHours) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: '09:00', close: '18:00' },
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to create a facility');
      }
      
      // Basic validation
      if (parseFloat(pricePerHour) <= 0) {
        throw new Error('Price must be greater than 0');
      }
      
      const facilityData = {
        name,
        description,
        address,
        city,
        postalCode,
        country,
        operatingHours,
        pricePerHour: parseFloat(pricePerHour),
        currency,
        sportType: sportTypes,
        amenities,
        ownerId: user.id,
        updatedAt: new Date().toISOString()
      };
      
      if (isEdit && facility?.id) {
        // Update existing facility
        const { error: updateError } = await supabase
          .from('facilities')
          .update(facilityData)
          .eq('id', facility.id);
          
        if (updateError) throw new Error(updateError.message);
      } else {
        // Create new facility
        const { error: insertError } = await supabase
          .from('facilities')
          .insert({
            ...facilityData,
            createdAt: new Date().toISOString()
          });
          
        if (insertError) throw new Error(insertError.message);
      }
      
      // Redirect to facilities page on success
      router.push('/facilities');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save facility');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Options for sport types
  const sportTypeOptions = [
    { value: 'football', label: 'Football' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'volleyball', label: 'Volleyball' },
    { value: 'badminton', label: 'Badminton' },
    { value: 'other', label: 'Other' }
  ];
  
  // Currency options
  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' }
  ];
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}
      
      {/* Basic Info Section */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Basic Information</h2>
        
        <Input
          label="Facility Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          
          <Input
            label="City"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
          
          <Input
            label="Postal Code"
            name="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
          />
          
          <Input
            label="Country"
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          />
        </div>
      </div>
      
      {/* Pricing Section */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Pricing</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Price per Hour"
            name="pricePerHour"
            type="number"
            value={pricePerHour}
            onChange={(e) => setPricePerHour(e.target.value)}
            required
          />
          
          <Select
            label="Currency"
            name="currency"
            options={currencyOptions}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
          />
        </div>
      </div>
      
      {/* Sports Types Section */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Sport Types</h2>
        
        <div className="space-y-2">
          {sportTypeOptions.map((option) => (
            <div key={option.value} className="flex items-center">
              <input
                type="checkbox"
                id={`sport-${option.value}`}
                checked={sportTypes.includes(option.value as SportType)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSportTypes([...sportTypes, option.value as SportType]);
                  } else {
                    setSportTypes(sportTypes.filter(type => type !== option.value));
                  }
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor={`sport-${option.value}`} className="ml-2 text-sm text-gray-700">
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Operating Hours Section */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Operating Hours</h2>
        
        {(Object.keys(operatingHours) as Array<keyof OperatingHours>).map((day) => (
          <div key={day} className="mb-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id={`open-${day}`}
                checked={operatingHours[day] !== null}
                onChange={() => toggleDayOpen(day)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor={`open-${day}`} className="ml-2 text-sm font-medium capitalize">
                {day}
              </label>
            </div>
            
            {operatingHours[day] && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={operatingHours[day]?.open}
                    onChange={(e) => handleOperatingHourChange(day, 'open', e.target.value)}
                    className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={operatingHours[day]?.close}
                    onChange={(e) => handleOperatingHourChange(day, 'close', e.target.value)}
                    className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading 
            ? 'Saving...' 
            : isEdit ? 'Update Facility' : 'Create Facility'
          }
        </Button>
      </div>
    </form>
  );
}
