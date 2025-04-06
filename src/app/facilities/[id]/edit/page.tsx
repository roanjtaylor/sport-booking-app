// src/app/facilities/[id]/edit/page.tsx
import EditFacilityClient from './EditFacilityClient';

interface PageProps {
  params: {
    id: string;
  };
}

export const dynamic = 'force-dynamic';

export default function EditFacilityPage({ params }: PageProps) {
  // Simply extract and pass the ID to the client component
  return <EditFacilityClient id={params.id} />;
}