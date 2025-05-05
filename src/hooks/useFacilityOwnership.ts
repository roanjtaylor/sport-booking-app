// src/hooks/useFacilityOwnership.ts
"use client";

import { useState, useEffect } from "react";
import { authApi, facilitiesApi } from "@/lib/api";

/**
 * Hook to check if the current user is the owner of a facility
 */
export function useFacilityOwnership(facilityId: string) {
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current user using auth API
        const { data: user, error: userError } = await authApi.getCurrentUser();

        if (userError) {
          throw new Error("Failed to get current user");
        }

        if (!user) {
          setIsOwner(false);
          return;
        }

        // Check facility ownership using facilities API
        const { isOwner: ownerStatus, error: facilityError } =
          await facilitiesApi.checkFacilityOwnership(facilityId, user.id);

        if (facilityError) {
          throw new Error("Failed to fetch facility details");
        }

        // Get the facility details to get the owner ID
        const { data: facility, error: facilityDetailsError } =
          await facilitiesApi.getFacilityById(facilityId);

        if (facilityDetailsError) {
          throw new Error("Failed to fetch facility owner details");
        }

        // Set ownership status and owner ID
        setOwnerId(facility.owner_id);
        setIsOwner(ownerStatus);
      } catch (err) {
        console.error("Error checking facility ownership:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (facilityId) {
      checkOwnership();
    }
  }, [facilityId]);

  return { isOwner, isLoading, error, ownerId };
}
