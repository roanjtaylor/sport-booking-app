// src/hooks/useFacilityOwnership.ts
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw new Error("Failed to get current user");
        }

        if (!user) {
          setIsOwner(false);
          return;
        }

        // Get facility details
        const { data: facility, error: facilityError } = await supabase
          .from("facilities")
          .select("owner_id")
          .eq("id", facilityId)
          .single();

        if (facilityError) {
          throw new Error("Failed to fetch facility details");
        }

        // Set ownership status and owner ID
        setOwnerId(facility.owner_id);
        setIsOwner(user.id === facility.owner_id);
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
