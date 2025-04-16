// src/components/discover/MapView.tsx
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// import L from "leaflet";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default function MapView() {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.509865, -0.118092]); // London default
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fix Leaflet marker icons
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }, []);

  // Fetch facilities
  useEffect(() => {
    async function fetchFacilities() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: facilitiesError } = await supabase
          .from("facilities")
          .select("*")
          .not("latitude", "is", null)
          .not("longitude", "is", null);

        if (facilitiesError) throw facilitiesError;
        setFacilities(data || []);

        // Center map on facilities if any exist
        if (data && data.length > 0) {
          const avgLat =
            data.reduce((sum, f) => sum + f.latitude, 0) / data.length;
          const avgLng =
            data.reduce((sum, f) => sum + f.longitude, 0) / data.length;
          setMapCenter([avgLat, avgLng]);
        }
      } catch (err) {
        console.error("Error fetching facilities:", err);
        setError("Failed to load facilities data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFacilities();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-[70vh] w-full relative">
        <MapContainer
          center={mapCenter}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {facilities.map((facility) => (
            <Marker
              key={facility.id}
              position={[facility.latitude, facility.longitude]}
              eventHandlers={{
                click: () => {
                  setSelectedFacility(facility);
                },
              }}
            >
              {selectedFacility && selectedFacility.id === facility.id && (
                <Popup onClose={() => setSelectedFacility(null)}>
                  <div className="p-2 max-w-xs">
                    <h3 className="font-medium text-lg mb-1">
                      {facility.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {facility.address}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {facility.sport_type.slice(0, 2).map((sport) => (
                        <span
                          key={sport}
                          className="bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full"
                        >
                          {sport}
                        </span>
                      ))}
                    </div>
                    <p className="font-medium text-primary-600 mb-2">
                      {formatPrice(facility.price_per_hour, facility.currency)}
                    </p>
                    <Link href={`/facilities/${facility.id}`}>
                      <Button variant="primary" size="sm" fullWidth>
                        View Facility
                      </Button>
                    </Link>
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Showing {facilities.length} facilities on the map
          {facilities.length === 0 && (
            <span> - Add coordinates to your facilities to see them here</span>
          )}
        </p>
      </div>
    </Card>
  );
}
