"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LobbyList } from "@/components/lobbies/LobbyList";
import { supabase } from "@/lib/supabase";
import { joinLobby } from "@/lib/lobbies";
import { Lobby } from "@/types/lobby";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";

type LobbiesClientProps = {
  initialLobbies: Lobby[];
};

export default function LobbiesClient({ initialLobbies }: LobbiesClientProps) {
  const [lobbies, setLobbies] = useState<Lobby[]>(initialLobbies);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoinLobby = async (lobbyId: string) => {
    try {
      setIsJoining(true);
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/auth/login?redirect=/lobbies`);
        return;
      }

      // Use the centralized joinLobby function
      const result = await joinLobby(lobbyId, user.id, user.email || "");

      // Show success message and redirect to lobby
      if (result.isWaiting) {
        alert("You've been added to the waiting list!");
      } else if (result.isFull) {
        alert("You've joined the lobby! The lobby is now full.");
      } else {
        alert("You've joined the lobby successfully!");
      }

      // Redirect to the lobby detail page
      router.push(`/lobbies/${lobbyId}`);
    } catch (err: any) {
      console.error("Error joining lobby:", err);
      setError(err.message || "Failed to join lobby");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <ErrorDisplay error={error} className="mb-6" />
      <LobbyList
        lobbies={lobbies}
        onJoinLobby={handleJoinLobby}
        isLoading={isJoining}
      />
    </>
  );
}
