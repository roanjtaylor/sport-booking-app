// src/app/lobbies/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { LobbyList } from "@/components/lobbies/LobbyList";
import { Card } from "@/components/ui/Card";

/**
 * Server component for the lobbies page
 * Lists all open lobbies available for joining
 */
export const dynamic = "force-dynamic";

export default async function LobbiesPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch all open lobbies with related data
  const { data: lobbies, error } = await supabase
    .from("lobbies")
    .select(
      `
    *,
    facility:facility_id(*)
  `
    )
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching lobbies:", error);
    // We'll handle errors in the client
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Open Game Lobbies</h1>
          <p className="text-gray-600">
            Join a lobby or browse facilities to create your own
          </p>
        </div>
        <Link href="/facilities">
          <Button>Browse Facilities</Button>
        </Link>
      </div>

      {/* Display lobbies if any exist */}
      {lobbies && lobbies.length > 0 ? (
        <LobbyList lobbies={lobbies} />
      ) : (
        <Card className="p-6 text-center">
          <h3 className="text-lg font-medium mb-2">No open lobbies found</h3>
          <p className="text-gray-600 mb-4">
            There are no open lobbies available right now. Browse facilities to
            create your own.
          </p>
          <Link href="/facilities">
            <Button>Browse Facilities</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
