// src/components/facilities/DeleteFacilityButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { facilitiesApi } from "@/lib/api";

interface DeleteFacilityButtonProps {
  facilityId: string;
}

export function DeleteFacilityButton({
  facilityId,
}: DeleteFacilityButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();

  // Handle the delete action
  const handleDelete = async () => {
    if (!facilityId) return;

    try {
      setIsDeleting(true);

      // Use the API service function instead of direct Supabase calls
      const { success, error } = await facilitiesApi.deleteFacility(facilityId);

      if (error) throw error;

      // Show success message and redirect
      alert("Facility deleted successfully");
      router.push("/facilities");
      router.refresh();
    } catch (error) {
      console.error("Error deleting facility:", error);
      alert("Failed to delete facility. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowConfirmation(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700 mb-4">
          Are you sure you want to delete this facility? This action cannot be
          undone.
        </p>
        <div className="flex space-x-3">
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Yes, Delete"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmation(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="danger" onClick={() => setShowConfirmation(true)}>
      Delete Facility
    </Button>
  );
}
