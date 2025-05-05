// src/components/discover/MapView.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LobbyList } from "@/components/lobbies/LobbyList";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { facilitiesApi, lobbiesApi, authApi } from "@/lib/api";

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

  // New state variables
  const [isMapExpanded, setIsMapExpanded] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilityLobbies, setFacilityLobbies] = useState([]);
  const [isJoiningLobby, setIsJoiningLobby] = useState(false);

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

        // Always fetch facilities with coordinates
        const { data: facilitiesData, error: facilitiesError } =
          await facilitiesApi.getFacilitiesWithCoordinates();

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

        if (mode === "lobby" || !mode) {
          // Fetch lobbies using API service
          const { data: lobbiesData, error: lobbiesError } =
            await lobbiesApi.getLobbiesWithCoordinates();

          if (lobbiesError) throw lobbiesError;
          setLobbies(lobbiesData || []);
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

  // Get all lobbies for a specific facility
  const getLobbiesForFacility = (facilityId) => {
    return lobbies.filter((lobby) => lobby.facility_id === facilityId);
  };

  // Handle viewing lobbies for a facility
  const handleViewFacilityLobbies = (facility) => {
    const facilityId = facility.id;
    const facilityLobbies = getLobbiesForFacility(facilityId);

    setSelectedFacility(facility);
    setFacilityLobbies(facilityLobbies);
    setIsMapExpanded(false);
    setSelectedItem(null); // Close popup
  };

  // Join lobby function
  const handleJoinLobby = async (lobbyId) => {
    try {
      setIsJoiningLobby(true);

      // Get current user using auth API
      const { data: user, error: userError } = await authApi.getCurrentUser();

      if (userError || !user) {
        router.push(`/auth/login?redirect=/discover?mode=lobby`);
        return;
      }

      // Use the lobbies API service to join the lobby
      const result = await lobbiesApi.joinLobby(
        lobbyId,
        user.id,
        user.email || ""
      );

      // Show success message
      if (result.isWaiting) {
        alert("You've been added to the waiting list!");
      } else if (result.isFull) {
        alert("You've joined the lobby! The lobby is now full.");
      } else {
        alert("You've joined the lobby successfully!");
      }

      // Redirect to the lobby detail page
      router.push(`/lobbies/${lobbyId}`);
    } catch (err) {
      console.error("Error joining lobby:", err);
      alert(err.message || "Failed to join lobby");
    } finally {
      setIsJoiningLobby(false);
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading map..." />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <EmptyState
          title="Error"
          message={error}
          actionText="Try again"
          actionLink="#"
          variant="compact"
          className="text-red-600"
          icon={null}
        />
      </Card>
    );
  }

  // Group lobbies by facility to count how many are at each location
  const lobbyCountByFacility = {};
  if (mode === "lobby") {
    lobbies.forEach((lobby) => {
      const facilityId = lobby.facility_id;
      lobbyCountByFacility[facilityId] =
        (lobbyCountByFacility[facilityId] || 0) + 1;
    });
  }

  // Determine what markers to show
  // In lobby mode, show facilities that have lobbies rather than individual lobbies
  const mapMarkers =
    mode === "lobby"
      ? facilities
          .filter((facility) => {
            // Only show facilities that have lobbies
            const facilityLobbies = lobbies.filter(
              (lobby) => lobby.facility_id === facility.id
            );
            return facilityLobbies.length > 0;
          })
          .map((facility) => ({
            id: facility.id,
            type: "facility",
            position: [facility.latitude, facility.longitude],
            data: facility,
            lobbyCount: lobbyCountByFacility[facility.id] || 0,
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
    <div className="space-y-4">
      {/* Collapsed Map Header - only show when map is collapsed */}
      {!isMapExpanded && selectedFacility && (
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
          <div>
            <h3 className="font-medium">{selectedFacility.name}</h3>
            <p className="text-sm text-gray-600">{selectedFacility.address}</p>
          </div>
          <Button onClick={() => setIsMapExpanded(true)} variant="outline">
            Return to Map
          </Button>
        </div>
      )}

      {/* Map - only show when expanded */}
      {isMapExpanded && (
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
                        {mode === "lobby" ? (
                          // Facility with lobbies popup in lobby mode
                          <>
                            <h3 className="font-medium text-lg mb-1">
                              {marker.data.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-2">
                              {marker.data.address}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {marker.data.sportType
                                ?.slice(0, 2)
                                .map((sport) => (
                                  <span
                                    key={sport}
                                    className="bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full"
                                  >
                                    {sport}
                                  </span>
                                ))}
                            </div>
                            <div className="text-sm font-medium text-blue-600 mb-2">
                              {marker.lobbyCount} active{" "}
                              {marker.lobbyCount === 1 ? "lobby" : "lobbies"}
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              fullWidth
                              onClick={() =>
                                handleViewFacilityLobbies(marker.data)
                              }
                            >
                              View Lobbies
                            </Button>
                          </>
                        ) : (
                          // Standard facility popup in booking mode
                          <>
                            <h3 className="font-medium text-lg mb-1">
                              {marker.data.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-2">
                              {marker.data.address}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {marker.data.sportType
                                ?.slice(0, 2)
                                .map((sport) => (
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
                                View Facility
                              </Button>
                            </Link>
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
              {mode === "lobby" && (
                <>Showing {mapMarkers.length} facilities with active lobbies</>
              )}
              {!mode && <>Showing {mapMarkers.length} items on the map</>}
              {mapMarkers.length === 0 && (
                <span> - Nothing found with coordinates</span>
              )}
            </p>
          </div>
        </Card>
      )}

      {/* Facility Lobbies Section - only show when map is collapsed and facility is selected */}
      {!isMapExpanded && selectedFacility && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Lobbies at {selectedFacility.name}
          </h2>

          {facilityLobbies.length > 0 ? (
            <LobbyList
              lobbies={facilityLobbies}
              onJoinLobby={handleJoinLobby}
              isLoading={isJoiningLobby}
              gridLayout={true}
            />
          ) : (
            <Card className="p-6 text-center">
              <p className="text-gray-600">
                No active lobbies found for this facility.
              </p>
              <Link href={`/facilities/${selectedFacility.id}?mode=lobby`}>
                <Button variant="primary" className="mt-4">
                  Create a Lobby
                </Button>
              </Link>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
