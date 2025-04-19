// src/components/discover/MapView.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

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

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

type BookingMode = "booking" | "lobby" | null;

interface MapViewProps {
  mode: BookingMode;
}

export default function MapView({ mode }: MapViewProps) {
  const [facilities, setFacilities] = useState([]);
  const [lobbies, setLobbies] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.509865, -0.118092]); // London default
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fix Leaflet marker icons - only runs on client side after component is mounted
  useEffect(() => {
    if (isMounted) {
      // Only import and use Leaflet on the client side
      import("leaflet").then((L) => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        });
      });
    }
  }, [isMounted]);

  // Fetch facilities and/or lobbies based on mode
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        if (mode === "booking" || !mode) {
          // Fetch facilities with coordinates
          const { data: facilitiesData, error: facilitiesError } =
            await supabase
              .from("facilities")
              .select("*")
              .not("latitude", "is", null)
              .not("longitude", "is", null);

          if (facilitiesError) throw facilitiesError;
          setFacilities(facilitiesData || []);

          // Center map on facilities if any exist with coordinates
          if (facilitiesData && facilitiesData.length > 0) {
            const validFacilities = facilitiesData.filter(
              (f) => f.latitude && f.longitude
            );

            if (validFacilities.length > 0) {
              const avgLat =
                validFacilities.reduce((sum, f) => sum + f.latitude, 0) /
                validFacilities.length;
              const avgLng =
                validFacilities.reduce((sum, f) => sum + f.longitude, 0) /
                validFacilities.length;
              setMapCenter([avgLat, avgLng]);
            }
          }
        }

        if (mode === "lobby" || !mode) {
          // Fetch lobbies and their associated facilities (with coordinates)
          const { data: lobbiesData, error: lobbiesError } = await supabase
            .from("lobbies")
            .select(
              `
              *,
              facility:facility_id(*)
            `
            )
            .eq("status", "open")
            .order("date", { ascending: true });

          if (lobbiesError) throw lobbiesError;

          // Filter lobbies to only include those with facilities that have coordinates
          const lobbiesWithCoordinates = (lobbiesData || []).filter(
            (lobby) =>
              lobby.facility &&
              lobby.facility.latitude &&
              lobby.facility.longitude
          );

          setLobbies(lobbiesWithCoordinates);

          // If in lobby mode and we have lobbies with coordinates, center the map on them
          if (mode === "lobby" && lobbiesWithCoordinates.length > 0) {
            const avgLat =
              lobbiesWithCoordinates.reduce(
                (sum, l) => sum + l.facility.latitude,
                0
              ) / lobbiesWithCoordinates.length;
            const avgLng =
              lobbiesWithCoordinates.reduce(
                (sum, l) => sum + l.facility.longitude,
                0
              ) / lobbiesWithCoordinates.length;
            setMapCenter([avgLat, avgLng]);
          }
        }
      } catch (err) {
        console.error("Error fetching data for map:", err);
        setError("Failed to load map data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [mode]);

  // Join lobby function
  const handleJoinLobby = async (lobbyId) => {
    // Implementation would be similar to the one in ListView
    // Redirect to lobby detail page for now
    router.push(`/lobbies/${lobbyId}`);
  };

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

  // Determine what to display based on mode
  const displayItems =
    mode === "booking"
      ? facilities
      : mode === "lobby"
      ? lobbies
      : [...facilities, ...lobbies];

  // In lobby mode, transform facility coords to lobby markers
  const mapMarkers =
    mode === "lobby"
      ? lobbies.map((lobby) => ({
          id: lobby.id,
          type: "lobby",
          position: [lobby.facility.latitude, lobby.facility.longitude],
          data: lobby,
        }))
      : facilities.map((facility) => ({
          id: facility.id,
          type: "facility",
          position: [facility.latitude, facility.longitude],
          data: facility,
        }));

  // Don't render the map if we're not mounted yet
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading map...</p>
      </div>
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

          {/* Render markers for facilities or lobbies based on mode */}
          {mapMarkers.map((marker) => (
            <Marker
              key={`${marker.type}-${marker.id}`}
              position={marker.position}
              eventHandlers={{
                click: () => {
                  setSelectedItem(marker);
                },
              }}
            >
              {selectedItem && selectedItem.id === marker.id && (
                <Popup onClose={() => setSelectedItem(null)}>
                  <div className="p-2 max-w-xs">
                    {marker.type === "facility" ? (
                      // Facility popup
                      <>
                        <h3 className="font-medium text-lg mb-1">
                          {marker.data.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {marker.data.address}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {marker.data.sport_type.slice(0, 2).map((sport) => (
                            <span
                              key={sport}
                              className="bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full"
                            >
                              {sport}
                            </span>
                          ))}
                        </div>
                        <p className="font-medium text-primary-600 mb-2">
                          {formatPrice(
                            marker.data.price_per_hour,
                            marker.data.currency
                          )}
                        </p>
                        <Link
                          href={`/facilities/${marker.data.id}${
                            mode ? `?mode=${mode}` : ""
                          }`}
                        >
                          <Button variant="primary" size="sm" fullWidth>
                            {mode === "booking" ? "Book Now" : "View Facility"}
                          </Button>
                        </Link>
                      </>
                    ) : (
                      // Lobby popup
                      <>
                        <h3 className="font-medium text-lg mb-1">
                          {marker.data.facility.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {marker.data.date} • {marker.data.start_time}
                        </p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                            {marker.data.current_players}/
                            {marker.data.min_players} Players
                          </span>
                          <span className="font-medium text-primary-600">
                            {formatPrice(
                              marker.data.facility.price_per_hour /
                                marker.data.min_players,
                              marker.data.facility.currency
                            )}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/lobbies/${marker.data.id}`}
                            className="flex-1"
                          >
                            <Button variant="primary" size="sm" fullWidth>
                              View Details
                            </Button>
                          </Link>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleJoinLobby(marker.data.id)}
                          >
                            Join
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {mode === "booking" && (
            <>Showing {facilities.length} facilities on the map</>
          )}
          {mode === "lobby" && <>Showing {lobbies.length} lobbies on the map</>}
          {!mode && <>Showing {displayItems.length} items on the map</>}
          {displayItems.length === 0 && (
            <span> - Nothing found with coordinates</span>
          )}
        </p>
      </div>
    </Card>
  );
}
