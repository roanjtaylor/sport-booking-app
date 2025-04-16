// src/app/lobbies/[id]/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import LobbyDetailClient from "./LobbyDetailClient";

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

  const supabase = await createServerSupabaseClient();

  // Fetch the lobby with related information
  const { data: lobby, error } = await supabase
    .from("lobbies")
    .select(
      `
      *,
      facility:facility_id(*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !lobby) {
    console.error("Error fetching lobby:", error);
    notFound();
  }

  // Fetch participants for this lobby
  const { data: participants, error: participantsError } = await supabase
    .from("lobby_participants")
    .select("*")
    .eq("lobby_id", id);

  // Then fetch user details separately for each participant
  if (participants) {
    // Fetch the user information for all participants
    const participantsWithUsers = await Promise.all(
      participants.map(async (participant) => {
        const { data: userData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", participant.user_id)
          .single();

        return {
          ...participant,
          user: userData,
        };
      })
    );

    // Add participants to the lobby object
    const lobbyWithParticipants = {
      ...lobby,
      participants: participantsWithUsers || [],
    };

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
          <LobbyDetailClient lobby={lobbyWithParticipants} />
        </Suspense>
      </div>
    );
  }
}
