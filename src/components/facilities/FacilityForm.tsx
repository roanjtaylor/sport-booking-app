// src/components/facilities/FacilityForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState(facility?.name || '');
  const [description, setDescription] = useState(facility?.description || '');
  const [address, setAddress] = useState(facility?.address || '');
  const [city, setCity] = useState(facility?.city || '');
  const [postalCode, setPostalCode] = useState(facility?.postal_code || '');
  const [country, setCountry] = useState(facility?.country || '');
  const [pricePerHour, setPricePerHour] = useState(facility?.price_per_hour?.toString() || '');
  const [currency, setCurrency] = useState(facility?.currency || 'USD');
  const [sportTypes, setSportTypes] = useState<SportType[]>(
    (facility?.sportType as SportType[]) || []
  );
  const [amenities, setAmenities] = useState<string[]>(facility?.amenities || []);
  const [imageUrl, setImageUrl] = useState(facility?.imageUrl || '');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
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

  // Define ordered days of the week
  const daysOfWeek: Array<keyof OperatingHours> = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ];

  // Amenities input
  const [newAmenity, setNewAmenity] = useState('');
  
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

  // Add a new amenity
  const handleAddAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity('');
    }
  };

  // Remove an amenity
  const handleRemoveAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity));
  };

  // Validate form fields
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!name.trim()) errors.name = 'Facility name is required';
    if (!description.trim()) errors.description = 'Description is required';
    if (!address.trim()) errors.address = 'Address is required';
    if (!city.trim()) errors.city = 'City is required';
    if (!postalCode.trim()) errors.postalCode = 'Postal code is required';
    if (!country.trim()) errors.country = 'Country is required';
    
    if (!pricePerHour.trim()) {
      errors.pricePerHour = 'Price per hour is required';
    } else if (isNaN(parseFloat(pricePerHour)) || parseFloat(pricePerHour) <= 0) {
      errors.pricePerHour = 'Price must be a positive number';
    }
    
    if (sportTypes.length === 0) {
      errors.sportTypes = 'At least one sport type must be selected';
    }
    
    // Validate operating hours
    let hasOpenDay = false;
    
    for (const day of daysOfWeek) {
      if (operatingHours[day]) {
        hasOpenDay = true;
        
        // Check if close time is after open time
        const openHour = parseInt(operatingHours[day]!.open.split(':')[0]);
        const openMinute = parseInt(operatingHours[day]!.open.split(':')[1]);
        const closeHour = parseInt(operatingHours[day]!.close.split(':')[0]);
        const closeMinute = parseInt(operatingHours[day]!.close.split(':')[1]);
        
        if (closeHour < openHour || (closeHour === openHour && closeMinute <= openMinute)) {
          errors[`hours_${day}`] = `Closing time must be after opening time on ${day}`;
        }
      }
    }
    
    if (!hasOpenDay) {
      errors.operatingHours = 'Facility must be open on at least one day';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    // Validate form
    if (!validateForm()) {
      // Focus the first input with an error
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) element.focus();
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Instead of throwing, redirect to login
        router.push(`/auth/login?redirect=${encodeURIComponent(
          isEdit && facility?.id 
            ? `/facilities/${facility.id}/edit`
            : '/facilities/add'
        )}`);
        return;
      }
      
      // Prepare facility data
      const facilityData = {
        name,
        description,
        address,
        city,
        postal_code: postalCode,
        country,
        image_url: imageUrl,
        operating_hours: operatingHours,
        price_per_hour: parseFloat(pricePerHour),
        currency,
        sport_type: sportTypes,
        amenities,
        owner_id: user.id,
        updated_at: new Date().toISOString()
      };
      
      if (isEdit && facility?.id) {
        // Update existing facility
        const { error: updateError } = await supabase
          .from('facilities')
          .update(facilityData)
          .eq('id', facility.id);
          
        if (updateError) throw new Error(updateError.message);
        setSuccessMessage('Facility updated successfully');
        
        // Refresh the page after a short delay
        setTimeout(() => {
          router.refresh();
          router.push(`/facilities/${facility.id}`);
        }, 1500);
      } else {
        // Create new facility
        const { data, error: insertError } = await supabase
          .from('facilities')
          .insert({
            ...facilityData,
            created_at: new Date().toISOString()
          })
          .select();
          
        if (insertError) throw new Error(insertError.message);
        
        setSuccessMessage('Facility created successfully');
        
        // Redirect to the new facility page after a short delay
        setTimeout(() => {
          router.refresh();
          if (data && data[0]) {
            router.push(`/facilities/${data[0].id}`);
          } else {
            router.push('/facilities');
          }
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save facility');
      // Scroll to the top to show the error
      window.scrollTo(0, 0);
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
      
      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md">
          {successMessage}
        </div>
      )}
      
      {/* Basic Info Section */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Basic Information</h2>
          
          <Input
            label="Facility Name"
            name="name"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            error={formErrors.name}
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className={`block w-full rounded-md shadow-sm ${
                formErrors.description 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
            )}
          </div>
          
          <Input
            label="Image URL (optional)"
            name="imageUrl"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Address"
              name="address"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              error={formErrors.address}
            />
            
            <Input
              label="City"
              name="city"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              error={formErrors.city}
            />
            
            <Input
              label="Postal Code"
              name="postalCode"
              id="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
              error={formErrors.postalCode}
            />
            
            <Input
              label="Country"
              name="country"
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              error={formErrors.country}
            />
          </div>
        </div>
      </Card>
      
      {/* Pricing Section */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Price per Hour"
              name="pricePerHour"
              id="pricePerHour"
              type="number"
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              required
              min="0.01"
              step="0.01"
              error={formErrors.pricePerHour}
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
      </Card>
      
      {/* Sports Types Section */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Sport Types</h2>
          
          {formErrors.sportTypes && (
            <p className="mb-3 text-sm text-red-600">{formErrors.sportTypes}</p>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
      </Card>
      
      {/* Amenities Section */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Amenities</h2>
          
          <div className="flex mb-4">
            <input
              type="text"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              placeholder="Add a new amenity"
              className="flex-grow rounded-l-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="button"
              onClick={handleAddAmenity}
              className="bg-primary-600 text-white px-4 py-2 rounded-r-md hover:bg-primary-700"
            >
              Add
            </button>
          </div>
          
          {amenities.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {amenities.map((amenity) => (
                <div 
                  key={amenity} 
                  className="bg-gray-100 rounded-full px-3 py-1 flex items-center text-sm"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(amenity)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No amenities added yet.</p>
          )}
        </div>
      </Card>
      
      {/* Operating Hours Section */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Operating Hours</h2>
          
          {formErrors.operatingHours && (
            <p className="mb-3 text-sm text-red-600">{formErrors.operatingHours}</p>
          )}
          
          {/* Use the ordered days array instead of Object.keys() */}
          {daysOfWeek.map((day) => (
            <div key={day} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
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
                    <label className="block text-xs text-gray-500 mb-1" htmlFor={`open-time-${day}`}>
                      Opening Time
                    </label>
                    <input
                      id={`open-time-${day}`}
                      type="time"
                      value={operatingHours[day]?.open}
                      onChange={(e) => handleOperatingHourChange(day, 'open', e.target.value)}
                      className={`block w-full rounded-md shadow-sm ${
                        formErrors[`hours_${day}`] 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" htmlFor={`close-time-${day}`}>
                      Closing Time
                    </label>
                    <input
                      id={`close-time-${day}`}
                      type="time"
                      value={operatingHours[day]?.close}
                      onChange={(e) => handleOperatingHourChange(day, 'close', e.target.value)}
                      className={`block w-full rounded-md shadow-sm ${
                        formErrors[`hours_${day}`] 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                    />
                  </div>
                  {formErrors[`hours_${day}`] && (
                    <div className="col-span-2">
                      <p className="text-sm text-red-600">{formErrors[`hours_${day}`]}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading 
            ? isEdit ? 'Updating...' : 'Creating...'
            : isEdit ? 'Update Facility' : 'Create Facility'
          }
        </Button>
      </div>
    </form>
  );
}