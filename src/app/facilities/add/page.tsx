// src/app/facilities/add/page.tsx
import { FacilityForm } from '@/components/facilities/FacilityForm';

/**
 * Page component for adding a new facility
 * This would be restricted to facility owners in a real application
 */
export default function AddFacilityPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add Your Facility</h1>
        <p className="text-gray-600">
          List your sports facility on our platform to reach more customers.
        </p>
      </div>
      
      {/* The FacilityForm component handles all the form logic */}
      <FacilityForm />
    </div>
  );
}
