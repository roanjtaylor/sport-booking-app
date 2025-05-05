// src/components/facilities/FacilityForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { OperatingHours, SportType, Facility } from "@/types/facility";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { authApi, facilitiesApi } from "@/lib/api";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const SetViewOnChange = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      // Create a component that uses useMap hook to set the view
      return function SetViewOnChange({ center }) {
        const map = mod.useMap();
        useEffect(() => {
          if (center) {
            map.setView(center, 14);
          }
        }, [center, map]);
        return null;
      };
    }),
  { ssr: false }
);

// Access MapBox token from environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type FacilityFormProps = {
  facility?: Partial<Facility>;
  isEdit?: boolean;
  isOwner?: boolean;
};

/**
 * Form for creating or editing a facility
 */
export function FacilityForm({
  facility,
  isEdit = false,
  isOwner = false,
}: FacilityFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fix Leaflet icon issues on client-side
  useEffect(() => {
    // Import Leaflet only on client side
    const L = require("leaflet");

    // Fix the icon paths
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }, []);

  // Check if user has permission to edit
  useEffect(() => {
    if (isEdit && !isOwner) {
      setError("You don't have permission to edit this facility");
      setTimeout(() => {
        router.push(`/facilities/${facility?.id}`);
      }, 2000);
    }
  }, [isEdit, isOwner, facility?.id, router]);

  // Form states
  const [name, setName] = useState(facility?.name || "");
  const [description, setDescription] = useState(facility?.description || "");
  const [address, setAddress] = useState(facility?.address || "");
  const [city, setCity] = useState(facility?.city || "");
  const [postalCode, setPostalCode] = useState(facility?.postal_code || "");
  const [country, setCountry] = useState(facility?.country || "");
  const [pricePerHour, setPricePerHour] = useState(
    facility?.price_per_hour?.toString() || ""
  );
  const [currency, setCurrency] = useState(facility?.currency || "USD");
  const [sportTypes, setSportTypes] = useState<SportType[]>(
    (facility?.sportType as SportType[]) || []
  );
  const [amenities, setAmenities] = useState<string[]>(
    facility?.amenities || []
  );
  const [imageUrl, setImageUrl] = useState(facility?.imageUrl || "");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [minPlayers, setMinPlayers] = useState(
    facility?.min_players?.toString() || "10"
  );

  // Map states
  const [latitude, setLatitude] = useState(facility?.latitude || 51.505);
  const [longitude, setLongitude] = useState(facility?.longitude || -0.09);
  const [mapVisible, setMapVisible] = useState(
    !!facility?.latitude && !!facility?.longitude
  );
  const [markerPosition, setMarkerPosition] = useState([
    facility?.latitude || 51.505,
    facility?.longitude || -0.09,
  ]);

  // Operating hours state
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(
    facility?.operatingHours || {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "10:00", close: "16:00" },
      sunday: null,
    }
  );

  // Amenities state
  const [newAmenity, setNewAmenity] = useState("");

  // Define ordered days of the week
  const daysOfWeek: Array<keyof OperatingHours> = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // Geocode the address to get coordinates
  const geocodeAddress = async () => {
    if (!address || !city || !country) {
      setFormErrors({
        ...formErrors,
        geocoding: "Please enter a complete address",
      });
      return;
    }

    setIsGeocoding(true);

    try {
      // Use the Nominatim OpenStreetMap service as a free alternative
      const query = encodeURIComponent(
        `${address}, ${city}, ${postalCode}, ${country}`
      );
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        setLatitude(lat);
        setLongitude(lon);
        setMarkerPosition([lat, lon]);
        setMapVisible(true);
      } else {
        setFormErrors({
          ...formErrors,
          geocoding: "Could not find coordinates for this address",
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setFormErrors({ ...formErrors, geocoding: "Error during geocoding" });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle operating hours changes
  const handleOperatingHourChange = (
    day: keyof OperatingHours,
    field: "open" | "close",
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
      [day]: prev[day] ? null : { open: "09:00", close: "18:00" },
    }));
  };

  // Add a new amenity
  const handleAddAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  // Remove an amenity
  const handleRemoveAmenity = (amenity: string) => {
    setAmenities(amenities.filter((a) => a !== amenity));
  };

  // Handle marker drag
  const handleMarkerDrag = (e) => {
    const { lat, lng } = e.target.getLatLng();
    setLatitude(lat);
    setLongitude(lng);
    setMarkerPosition([lat, lng]);
  };

  // Validate form fields
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) errors.name = "Facility name is required";
    if (!description.trim()) errors.description = "Description is required";
    if (!address.trim()) errors.address = "Address is required";
    if (!city.trim()) errors.city = "City is required";
    if (!postalCode.trim()) errors.postalCode = "Postal code is required";
    if (!country.trim()) errors.country = "Country is required";

    if (!pricePerHour.trim()) {
      errors.pricePerHour = "Price per hour is required";
    } else if (
      isNaN(parseFloat(pricePerHour)) ||
      parseFloat(pricePerHour) <= 0
    ) {
      errors.pricePerHour = "Price must be a positive number";
    }

    if (sportTypes.length === 0) {
      errors.sportTypes = "At least one sport type must be selected";
    }

    if (!minPlayers.trim()) {
      errors.minPlayers = "Minimum players is required";
    } else if (isNaN(parseInt(minPlayers)) || parseInt(minPlayers) < 2) {
      errors.minPlayers = "Minimum players must be at least 2";
    }

    // Validate operating hours
    let hasOpenDay = false;

    for (const day of daysOfWeek) {
      if (operatingHours[day]) {
        hasOpenDay = true;

        // Check if close time is after open time
        const openHour = parseInt(operatingHours[day]!.open.split(":")[0]);
        const openMinute = parseInt(operatingHours[day]!.open.split(":")[1]);
        const closeHour = parseInt(operatingHours[day]!.close.split(":")[0]);
        const closeMinute = parseInt(operatingHours[day]!.close.split(":")[1]);

        if (
          closeHour < openHour ||
          (closeHour === openHour && closeMinute <= openMinute)
        ) {
          errors[
            `hours_${day}`
          ] = `Closing time must be after opening time on ${day}`;
        }
      }
    }

    if (!hasOpenDay) {
      errors.operatingHours = "Facility must be open on at least one day";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (isEdit && !isOwner) {
      setError("You don't have permission to edit this facility");
      return;
    }

    if (!validateForm()) {
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) element.focus();
      return;
    }

    setIsLoading(true);

    try {
      // Get current user using the API service
      const { data: user, error: userError } = await authApi.getCurrentUser();

      if (userError || !user) {
        router.push(
          `/auth/login?redirect=${encodeURIComponent(
            isEdit && facility?.id
              ? `/facilities/${facility.id}/edit`
              : "/facilities/add"
          )}`
        );
        return;
      }

      const facilityData = {
        name,
        description,
        address,
        city,
        postal_code: postalCode,
        country,
        imageUrl,
        operatingHours,
        price_per_hour: Number(parseFloat(pricePerHour)),
        currency,
        sportType: sportTypes,
        min_players: Number(parseInt(minPlayers)),
        amenities,
        owner_id: user.id,
        owner_email: user.email,
        latitude,
        longitude,
      };

      if (isEdit && facility?.id) {
        // Update existing facility using the API service
        const { error: updateError } = await facilitiesApi.updateFacility(
          facility.id,
          facilityData
        );

        if (updateError) throw updateError;
        setSuccessMessage("Facility updated successfully");

        setTimeout(() => {
          router.refresh();
          router.push(`/facilities/${facility.id}`);
        }, 1500);
      } else {
        // Create new facility using the API service
        const { data, error: insertError } = await facilitiesApi.createFacility(
          facilityData as Omit<Facility, "id">
        );

        if (insertError) throw insertError;

        setSuccessMessage("Facility created successfully");

        setTimeout(() => {
          router.refresh();
          if (data && data[0]) {
            router.push(`/facilities/${data[0].id}`);
          } else {
            router.push("/facilities");
          }
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save facility");
      window.scrollTo(0, 0);
    } finally {
      setIsLoading(false);
    }
  };

  // Show a permission error if in edit mode and not the owner
  if (isEdit && !isOwner) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-600 mb-4">
          You don't have permission to edit this facility
        </div>
        <Button onClick={() => router.push(`/facilities/${facility?.id}`)}>
          Return to Facility
        </Button>
      </Card>
    );
  }

  // Options for form selects
  const sportTypeOptions = [
    { value: "football", label: "Football" },
    { value: "indoors", label: "Indoors" },
    { value: "outdoors", label: "Outdoors" },
    { value: "11 aside", label: "11 aside" },
    { value: "7 aside", label: "7 aside" },
    { value: "5 aside", label: "5 aside" },
  ];

  const currencyOptions = [
    { value: "GBP", label: "GBP (£)" },
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
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
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="description"
            >
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
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              }`}
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.description}
              </p>
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

      {/* Location Map Section */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Location Information</h2>

          <div className="mt-4">
            <Button
              type="button"
              onClick={geocodeAddress}
              variant="secondary"
              disabled={isGeocoding}
            >
              {isGeocoding
                ? "Getting Coordinates..."
                : "Get Coordinates from Address"}
            </Button>

            {formErrors.geocoding && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.geocoding}
              </p>
            )}
          </div>

          {/* Display the map using Leaflet */}
          {mapVisible && (
            <div className="mt-4 h-64 rounded-lg overflow-hidden">
              <MapContainer
                center={markerPosition}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={markerPosition}
                  draggable={true}
                  eventHandlers={{
                    dragend: handleMarkerDrag,
                  }}
                />
                <SetViewOnChange center={markerPosition} />
              </MapContainer>
            </div>
          )}

          {/* Manual coordinate inputs */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Input
              label="Latitude"
              name="latitude"
              type="number"
              step="0.000001"
              value={latitude || ""}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setLatitude(value);
                setMarkerPosition([value, longitude || 0]);
                setMapVisible(true);
              }}
            />
            <Input
              label="Longitude"
              name="longitude"
              type="number"
              step="0.000001"
              value={longitude || ""}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setLongitude(value);
                setMarkerPosition([latitude || 0, value]);
                setMapVisible(true);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Pricing Section */}
      <Card className="overflow-hidden">
        {/* Pricing content */}
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
              min="0"
              step="1"
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
            <Input
              label="Minimum Players for Lobby"
              name="minPlayers"
              id="minPlayers"
              type="number"
              value={minPlayers}
              onChange={(e) => setMinPlayers(e.target.value)}
              required
              min="2"
              step="1"
              error={formErrors.minPlayers}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This is the minimum number of players needed to form a complete team
            for this facility. Players can create lobbies that others can join
            until this number is reached.
          </p>
        </div>
      </Card>

      {/* Sports Types Section */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Game Tags</h2>

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
                      setSportTypes(
                        sportTypes.filter((type) => type !== option.value)
                      );
                    }
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`sport-${option.value}`}
                  className="ml-2 text-sm text-gray-700"
                >
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
            <p className="mb-3 text-sm text-red-600">
              {formErrors.operatingHours}
            </p>
          )}

          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="mb-4 pb-4 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0"
            >
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`open-${day}`}
                  checked={operatingHours[day] !== null}
                  onChange={() => toggleDayOpen(day)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`open-${day}`}
                  className="ml-2 text-sm font-medium capitalize"
                >
                  {day}
                </label>
              </div>

              {operatingHours[day] && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <label
                      className="block text-xs text-gray-500 mb-1"
                      htmlFor={`open-time-${day}`}
                    >
                      Opening Time
                    </label>
                    <input
                      id={`open-time-${day}`}
                      type="time"
                      value={operatingHours[day]?.open}
                      onChange={(e) =>
                        handleOperatingHourChange(day, "open", e.target.value)
                      }
                      className={`block w-full rounded-md shadow-sm ${
                        formErrors[`hours_${day}`]
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs text-gray-500 mb-1"
                      htmlFor={`close-time-${day}`}
                    >
                      Closing Time
                    </label>
                    <input
                      id={`close-time-${day}`}
                      type="time"
                      value={operatingHours[day]?.close}
                      onChange={(e) =>
                        handleOperatingHourChange(day, "close", e.target.value)
                      }
                      className={`block w-full rounded-md shadow-sm ${
                        formErrors[`hours_${day}`]
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                      }`}
                    />
                  </div>
                  {formErrors[`hours_${day}`] && (
                    <div className="col-span-2">
                      <p className="text-sm text-red-600">
                        {formErrors[`hours_${day}`]}
                      </p>
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
            ? isEdit
              ? "Updating..."
              : "Creating..."
            : isEdit
            ? "Update Facility"
            : "Create Facility"}
        </Button>
      </div>
    </form>
  );
}
