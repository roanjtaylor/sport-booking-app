// src/app/lobbies/[id]/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { notFound } from "next/navigation";
import LobbyDetailClient from "./LobbyDetailClient";
import { lobbiesApi } from "@/lib/api"; // Import from the API layer

interface PageProps {
  params:
    | Promise<{
        id: string;
      }>
    | { id: string };
}

/**
 * Server component for the lobby detail page
 */
export const dynamic = "force-dynamic";

export default async function LobbyDetailPage({ params }: PageProps) {
  // Handle params as a potential Promise
  const resolvedParams = "then" in params ? await params : params;
  const id = resolvedParams.id;

  if (!id) {
    notFound();
  }

  try {
    // Use the API layer to fetch lobby details
    const { data: lobby, error } = await lobbiesApi.getLobbyById(id);

    if (error || !lobby) {
      console.error("Error fetching lobby:", error);
      notFound();
    }

    return (
      <div>
        <div className="mb-8">
          <Link
            href="/discover"
            className="text-primary-600 hover:underline inline-flex items-center"
          >
            ← Back to Lobbies
          </Link>
          <h1 className="text-3xl font-bold mt-2">Lobby Details</h1>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
                <p className="mt-4 text-gray-600">Loading lobby details...</p>
              </div>
            </div>
          }
        >
          <LobbyDetailClient lobby={lobby} />
        </Suspense>
      </div>
    );
  } catch (err) {
    console.error("Error in lobby page:", err);
    notFound();
  }
}
