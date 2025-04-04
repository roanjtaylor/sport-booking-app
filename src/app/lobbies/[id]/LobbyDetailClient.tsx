// src/app/lobbies/[id]/LobbyDetailClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { Lobby } from '@/types/lobby';
import { formatDate, formatTime, formatPrice } from '@/lib/utils';
import Link from 'next/link';

type LobbyDetailClientProps = {
  lobby: Lobby;
};

/**
 * Client component for handling lobby detail interactions
 */
export default function LobbyDetailClient({ lobby }: LobbyDetailClientProps) {
  const router = useRouter();

  // State variables
  const [currentLobby, setCurrentLobby] = useState<Lobby>(lobby);
  const [isCreator, setIsCreator] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Check if user is authenticated, creator, or participant
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          setIsCreator(user.id === lobby.creator_id);
          
          // Check if user is a participant
          const isUserParticipant = lobby.participants?.some(
            participant => participant.user_id === user.id
          );
          
          setIsParticipant(isUserParticipant || false);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error checking user status:', err);
        setIsLoading(false);
      }
    };
    
    checkUserStatus();
  }, [lobby]);
  
  // Handle joining the lobby
  const handleJoinLobby = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      if (!userId) {
        router.push(`/auth/login?redirect=/lobbies/${lobby.id}`);
        return;
      }
      
      // Check if the user is already a participant
      if (isParticipant) {
        setError('You are already in this lobby');
        return;
      }
      
      // Add user as a participant
      const { error: participantError } = await supabase
        .from('lobby_participants')
        .insert({
          lobby_id: lobby.id,
          user_id: userId
        });
        
      if (participantError) throw participantError;
      
      // Get updated lobby and participants
      const { data: updatedParticipants, error: participantsError } = await supabase
        .from('lobby_participants')
        .select('*')
        .eq('lobby_id', lobby.id);
  
      if (participantsError) throw participantsError;

      // Fetch user details for all participants
      const participantsWithUsers = await Promise.all(
        (updatedParticipants || []).map(async (participant) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', participant.user_id)
            .single();
      
          return {
            ...participant,
            user: userData
          };
        })
      );

      // Update participant count
      const newParticipantCount = participantsWithUsers?.length || 0;
      const { error: updateError } = await supabase
        .from('lobbies')
        .update({ 
          current_players: newParticipantCount,
          updated_at: new Date().toISOString(),
          status: newParticipantCount >= lobby.min_players ? 'filled' : 'open'
        })
        .eq('id', lobby.id);
        
      if (updateError) throw updateError;
      
      // If this was the last player needed, create a booking
      if (newParticipantCount >= lobby.min_players) {
        // Get facility price information
        const { data: facility, error: facilityError } = await supabase
          .from('facilities')
          .select('price_per_hour')
          .eq('id', lobby.facility_id)
          .single();
          
        if (facilityError) throw facilityError;
        
        // Create a booking from this lobby
        const { error: bookingError } = await supabase
          .from('bookings')
          .insert({
            facility_id: lobby.facility_id,
            user_id: lobby.creator_id, // Creator is responsible for the booking
            date: lobby.date,
            start_time: lobby.start_time,
            end_time: lobby.end_time,
            status: 'pending',
            total_price: facility.price_per_hour,
            notes: `Group booking from lobby: ${lobby.id}`,
            lobby_id: lobby.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (bookingError) throw bookingError;
      }
      
      // Update the local state
      setCurrentLobby({
        ...currentLobby,
        participants: participantsWithUsers || [],
        current_players: newParticipantCount
      });
      
      setIsParticipant(true);
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (err: any) {
      console.error('Error joining lobby:', err);
      setError(err.message || 'Failed to join lobby');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle leaving the lobby
  const handleLeaveLobby = async () => {
    try {
      if (!confirm('Are you sure you want to leave this lobby?')) {
        return;
      }
      
      setIsProcessing(true);
      setError(null);
      
      if (!userId) {
        router.push(`/auth/login?redirect=/lobbies/${lobby.id}`);
        return;
      }
      
      // Remove user from participants
      const { error: deleteError } = await supabase
        .from('lobby_participants')
        .delete()
        .eq('lobby_id', lobby.id)
        .eq('user_id', userId);
        
      if (deleteError) throw deleteError;
      
      // Get updated participants count
      const { data: participants, error: participantsError } = await supabase
        .from('lobby_participants')
        .select('id')
        .eq('lobby_id', lobby.id);
        
      if (participantsError) throw participantsError;
      
      // Update lobby with new participant count
      const newParticipantCount = participants?.length || 0;

      const { error: updateError } = await supabase
        .from('lobbies')
        .update({ 
          current_players: newParticipantCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', lobby.id);
        
      if (updateError) throw updateError;
      
      // Redirect to lobbies page
      router.push('/facilities/' + lobby.facility_id);
      router.refresh();
    } catch (err: any) {
      console.error('Error leaving lobby:', err);
      setError(err.message || 'Failed to leave lobby');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle cancelling the lobby (for creators only)
  const handleCancelLobby = async () => {
    try {
      if (!confirm('Are you sure you want to cancel this lobby? This cannot be undone.')) {
        return;
      }
      
      setIsProcessing(true);
      setError(null);
      
      if (!userId || !isCreator) {
        setError('You must be the creator to cancel this lobby');
        return;
      }
      
      // Update lobby status to cancelled
      const { error: updateError } = await supabase
        .from('lobbies')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', lobby.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setCurrentLobby({
        ...currentLobby,
        status: 'cancelled'
      });
      
      // Refresh the page
      router.refresh();
    } catch (err: any) {
      console.error('Error cancelling lobby:', err);
      setError(err.message || 'Failed to cancel lobby');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading lobby details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => setError(null)}>Dismiss</Button>
      </Card>
    );
  }

  // Format the status for display
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'filled':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Lobby Details
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(currentLobby.status)}`}>
            {currentLobby.status.charAt(0).toUpperCase() + currentLobby.status.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lobby information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Lobby Information</h4>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Date</dt>
                <dd className="mt-1 text-gray-900">{formatDate(currentLobby.date)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Time</dt>
                <dd className="mt-1 text-gray-900">
                  {formatTime(currentLobby.start_time)} - {formatTime(currentLobby.end_time)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Players</dt>
                <dd className="mt-1 text-gray-900">
                  {currentLobby.current_players} / {currentLobby.min_players} 
                  <span className="text-gray-500 ml-1">
                    ({currentLobby.min_players - currentLobby.current_players} more needed)
                  </span>
                </dd>
              </div>
              {currentLobby.notes && (
                <div>
                  <dt className="text-gray-500">Notes</dt>
                  <dd className="mt-1 text-gray-900">{currentLobby.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Created By</dt>
                <dd className="mt-1 text-gray-900">{currentLobby.creator_email || currentLobby.creator?.email || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Created At</dt>
                <dd className="mt-1 text-gray-900">{formatDate(currentLobby.created_at)}</dd>
              </div>
            </dl>
          </div>
          
          {/* Facility information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Facility Information</h4>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="mt-1 text-gray-900">{currentLobby.facility?.name || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="mt-1 text-gray-900">
                  {currentLobby.facility ? (
                    <>
                      {currentLobby.facility.address}, {currentLobby.facility.city}, {currentLobby.facility.postal_code}
                    </>
                  ) : (
                    'Unknown'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Price Per Hour</dt>
                <dd className="mt-1 text-gray-900">
                  {currentLobby.facility ? (
                    formatPrice(
                      currentLobby.facility.price_per_hour, 
                      currentLobby.facility.currency
                    )
                  ) : (
                    'Unknown'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Game Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {currentLobby.facility?.sport_type ? 
                    currentLobby.facility.sport_type.map((sport: string) => (
                      <span 
                        key={sport} 
                        className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </span>
                    )) : 
                    currentLobby.facility?.sportType?.map((sport: string) => (
                      <span 
                        key={sport} 
                        className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </span>
                    ))
                  }
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Participants section */}
        <div className="mt-8">
          <h4 className="font-medium text-gray-900 mb-3">Participants ({currentLobby.current_players}/{currentLobby.min_players})</h4>
          <div className="bg-gray-50 rounded-md p-4">
            {currentLobby.participants && currentLobby.participants.length > 0 ? (
              <ul className="divide-y divide-gray-200">
              {currentLobby.participants.map((participant) => (
                <li key={participant.id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                      {(participant.participant_email || participant.user?.email || 'Unknown')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {participant.participant_email || participant.user?.email || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {participant.user_id === currentLobby.creator_id ? 'Creator' : 'Participant'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Joined {formatDate(participant.joined_at, 'PPp')}
                  </p>
                </li>
              ))}
            </ul>
            ) : (
              <p className="text-gray-500 text-center py-2">No participants yet</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <Link href={`/facilities/${currentLobby.facility_id}`}>
            <Button variant="secondary">
              Back to Facility
            </Button>
          </Link>
          
          {currentLobby.status === 'open' && !isParticipant && (
            <Button onClick={handleJoinLobby} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Join Lobby'}
            </Button>
          )}
          
          {currentLobby.status === 'open' && isParticipant && !isCreator && (
            <Button variant="outline" onClick={handleLeaveLobby} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Leave Lobby'}
            </Button>
          )}
          
          {currentLobby.status === 'open' && isCreator && (
            <Button variant="danger" onClick={handleCancelLobby} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Cancel Lobby'}
            </Button>
          )}
          
          {currentLobby.status === 'filled' && (
            <Link href={`/bookings`}>
              <Button>
                View Booking
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}