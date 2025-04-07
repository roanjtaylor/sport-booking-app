// src/components/bookings/LobbyParticipants.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

type LobbyParticipantsProps = {
  lobbyId: string;
};

export function LobbyParticipants({ lobbyId }: LobbyParticipantsProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchParticipants() {
      try {
        setIsLoading(true);
        
        // First, fetch just the participants without trying to join with profiles
        const { data: participantsData, error: participantsError } = await supabase
          .from('lobby_participants')
          .select('*')
          .eq('lobby_id', lobbyId);
          
        if (participantsError) throw participantsError;
        
        // Then fetch profile data for each participant separately
        const participantsWithProfiles = await Promise.all(
          (participantsData || []).map(async (participant) => {
            // Get profile data for this user_id
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', participant.user_id)
              .single();
              
            return {
              ...participant,
              user: profileData || { email: 'Unknown' }
            };
          })
        );
        
        setParticipants(participantsWithProfiles);
      } catch (err) {
        console.error('Error fetching lobby participants:', err);
        setError('Failed to load participants');
      } finally {
        setIsLoading(false);
      }
    }

    if (lobbyId) {
      fetchParticipants();
    }
  }, [lobbyId]);

  // Rest of the component remains the same
  if (isLoading) {
    return <div className="text-center py-4">Loading participants...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>;
  }

  return (
    <Card className="p-4 mt-6">
      <h4 className="font-medium text-gray-900 mb-3">Group Booking Participants</h4>
      
      {participants.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {participants.map((participant) => (
            <li key={participant.id} className="py-3 flex items-center">
              <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                {(participant.user?.name || participant.user?.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {participant.user?.name || participant.user?.email || 'Unknown User'}
                </p>
                <p className="text-xs text-gray-500">
                  Joined {formatDate(participant.joined_at, 'PP')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm">No participants found</p>
      )}
    </Card>
  );
}