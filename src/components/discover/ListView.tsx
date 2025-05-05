// src/components/discover/ListView.tsx
"use client";

import { useState, useEffect } from "react";
import FacilitiesClient from "@/app/facilities/FacilitiesClient";
import { LobbyList } from "@/components/lobbies/LobbyList";
import { LobbyFilters } from "@/components/lobbies/LobbyFilters";
import { FacilityFilters } from "@/components/facilities/FacilityFilters";
import { Card } from "@/components/ui/Card";
import type { Facility } from "@/types/facility";
import type { Lobby } from "@/types/lobby";
import { useRouter } from "next/navigation";
import { LoadingIndicator } from "../ui/LoadingIndicator";
import { EmptyState } from "../ui/EmptyState";
import { facilitiesApi, lobbiesApi, authApi } from "@/lib/api";

type BookingMode = "booking" | "lobby" | null;

interface ListViewProps {
  mode: BookingMode;
  onCreateLobby?: () => void;
}

export default function ListView({ mode, onCreateLobby }: ListViewProps) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [filteredLobbies, setFilteredLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoiningLobby, setIsJoiningLobby] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Only fetch what we need based on mode
        if (mode === "booking" || !mode) {
          // Fetch facilities data using API service
          const { data: facilitiesData, error: facilitiesError } =
            await facilitiesApi.getAllFacilities();

          if (facilitiesError) throw facilitiesError;

          setFacilities(facilitiesData || []);
          setFilteredFacilities(facilitiesData || []);
        }

        if (mode === "lobby" || !mode) {
          // Fetch lobbies data using API service
          const { data: lobbiesData, error: lobbiesError } =
            await lobbiesApi.getOpenLobbies();

          if (lobbiesError) throw lobbiesError;

          setLobbies(lobbiesData || []);
          setFilteredLobbies(lobbiesData || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [mode]);

  // Get unique sport types from facilities
  const sportTypes = Array.from(
    new Set(facilities.flatMap((f) => f.sportType || []))
  );

  const handleFacilityFilter = async (filters: {
    search: string;
    sportType: string;
    priceSort: string;
  }) => {
    try {
      // Use the API service for filtering
      const { data: filtered, error: filterError } =
        await facilitiesApi.filterFacilities(filters);

      if (filterError) throw filterError;
      setFilteredFacilities(filtered || []);
    } catch (err) {
      console.error("Error filtering facilities:", err);
      setError("Failed to filter facilities");
    }
  };

  const handleLobbyFilter = async (filters: {
    search: string;
    sportType: string;
    dateRange: string;
  }) => {
    try {
      // Use the API service for filtering
      const { data: filtered, error: filterError } =
        await lobbiesApi.filterLobbies(filters);

      if (filterError) throw filterError;
      setFilteredLobbies(filtered || []);
    } catch (err) {
      console.error("Error filtering lobbies:", err);
      setError("Failed to filter lobbies");
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading data..." />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <EmptyState
          title="Error"
          message={error}
          variant="compact"
          children={
            <button
              onClick={() => window.location.reload()}
              className="text-primary-600 hover:underline mt-4"
            >
              Try again
            </button>
          }
        />
      </Card>
    );
  }

  const handleJoinLobby = async (lobbyId: string) => {
    try {
      setIsJoiningLobby(true);
      setJoinError(null);

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

      // Refresh the lobbies data to show updated status
      const { data: updatedLobbies } = await lobbiesApi.getOpenLobbies();

      if (updatedLobbies) {
        setLobbies(updatedLobbies);
        setFilteredLobbies(updatedLobbies);
      }

      // Redirect to the lobby detail page
      router.push(`/lobbies/${lobbyId}`);
    } catch (err: any) {
      console.error("Error joining lobby:", err);
      setJoinError(err.message || "Failed to join lobby");
      alert(err.message || "Failed to join lobby");
    } finally {
      setIsJoiningLobby(false);
    }
  };

  // Render content based on mode
  if (mode === "booking") {
    return (
      <>
        <div className="mb-8">
          <FacilityFilters
            onFilter={handleFacilityFilter}
            sportTypes={sportTypes}
          />
        </div>
        <FacilitiesClient
          initialFacilities={filteredFacilities}
          isFiltered={true}
        />
      </>
    );
  } else if (mode === "lobby") {
    return (
      <>
        <div className="mb-8">
          <LobbyFilters onFilter={handleLobbyFilter} sportTypes={sportTypes} />
        </div>

        <LobbyList
          lobbies={filteredLobbies}
          onJoinLobby={handleJoinLobby}
          isLoading={isJoiningLobby}
          gridLayout={true}
        />
      </>
    );
  }

  // Fallback (should never reach here with proper mode)
  return null;
}
