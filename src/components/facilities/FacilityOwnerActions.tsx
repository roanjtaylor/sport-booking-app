// src/components/facilities/FacilityOwnerActions.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DeleteFacilityButton } from "./DeleteFacilityButton";
import { authApi, facilitiesApi } from "@/lib/api";

interface FacilityOwnerActionsProps {
  facilityId: string;
  ownerId: string;
}

export function FacilityOwnerActions({
  facilityId,
  ownerId,
}: FacilityOwnerActionsProps) {
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the current user is the owner of the facility
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        setIsLoading(true);

        // Get current user using the API service
        const { data: user, error: userError } = await authApi.getCurrentUser();

        if (userError) {
          console.error("Error getting current user:", userError);
          return;
        }

        if (!user) {
          setIsOwner(false);
          return;
        }

        // Check if user is the owner using the API service
        const { isOwner: ownerStatus, error: ownershipError } =
          await facilitiesApi.checkFacilityOwnership(facilityId, user.id);

        if (ownershipError) {
          console.error("Error checking ownership:", ownershipError);
        }

        setIsOwner(ownerStatus);
      } catch (error) {
        console.error("Error checking ownership:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOwnership();
  }, [facilityId, ownerId]);

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (!isOwner) {
    return null; // Don't show owner actions if not the owner
  }

  return (
    <Card className="p-6 mt-8">
      <h2 className="text-xl font-semibold mb-4">Owner Actions</h2>
      <div className="space-y-4">
        <p className="text-gray-600 mb-3">
          As the owner of this facility, you can edit details or manage
          bookings.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={`/facilities/${facilityId}/edit`}>
            <Button>Edit Facility</Button>
          </Link>
          <Link href="/dashboard/facility-bookings">
            <Button variant="secondary">Manage Bookings</Button>
          </Link>
          <DeleteFacilityButton facilityId={facilityId} />
        </div>
      </div>
    </Card>
  );
}
