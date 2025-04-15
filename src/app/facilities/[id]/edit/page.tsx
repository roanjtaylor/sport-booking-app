// src/app/facilities/[id]/edit/page.tsx
import EditFacilityClient from "./EditFacilityClient";

interface PageProps {
  params:
    | Promise<{
        id: string;
      }>
    | {
        id: string;
      };
}

export const dynamic = "force-dynamic";

export default async function EditFacilityPage({ params }: PageProps) {
  // Handle params as a potential Promise
  const resolvedParams = "then" in params ? await params : params;
  const id = resolvedParams.id;

  // Pass the extracted ID to the client component
  return <EditFacilityClient id={id} />;
}
