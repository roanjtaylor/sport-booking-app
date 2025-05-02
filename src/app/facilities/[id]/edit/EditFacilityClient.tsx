// src/app/facilities/[id]/edit/EditFacilityClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FacilityForm } from "@/components/facilities/FacilityForm";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { authApi, facilitiesApi } from "@/lib/api";

interface EditFacilityClientProps {
  id: string;
}

export default function EditFacilityClient({ id }: EditFacilityClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [facility, setFacility] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFacility() {
      try {
        setIsLoading(true);

        // Check authentication using the API layer
        const { data: user, error: authError } = await authApi.getCurrentUser();

        if (authError || !user) {
          router.push(`/auth/login?redirect=/facilities/${id}/edit`);
          return;
        }

        // Fetch facility data using the API layer
        const { data: facilityData, error: facilityError } =
          await facilitiesApi.getFacilityById(id);

        if (facilityError) {
          console.error("Facility fetch error:", facilityError);
          setError(
            "Facility not found or you do not have permission to edit it"
          );
          return;
        }

        if (!facilityData) {
          setError("Facility not found");
          return;
        }

        setFacility(facilityData);

        // Check if user is the owner using the API layer
        const { isOwner: ownerStatus, error: ownerError } =
          await facilitiesApi.checkFacilityOwnership(id, user.id);

        if (ownerError) {
          console.error("Error checking ownership:", ownerError);
        }

        setIsOwner(ownerStatus);
      } catch (err: any) {
        console.error("Error loading facility:", err);
        setError(err.message || "An error occurred while loading the facility");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadFacility();
    }
  }, [id, router]);

  if (isLoading) {
    return <LoadingIndicator message="Loading facility data..." />;
  }

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <EmptyState
          title="Error"
          message={error}
          actionLink="/facilities"
          actionText="Return to Facilities"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/facilities/${id}`}
          className="text-primary-600 hover:underline inline-flex items-center mb-4"
        >
          ← Back to Facility
        </Link>
        <h1 className="text-3xl font-bold mb-2">Edit Facility</h1>
        <p className="text-gray-600">Update your facility information below.</p>
      </div>

      {facility && (
        <FacilityForm facility={facility} isEdit={true} isOwner={isOwner} />
      )}
    </div>
  );
}
