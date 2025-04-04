// src/components/lobbies/LobbyList.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate, formatTime } from '@/lib/utils';
import { Lobby } from '@/types/lobby';

type LobbyListProps = {
  lobbies: Lobby[];
  onJoinLobby?: (lobbyId: string) => Promise<void>;
  isLoading?: boolean;
};

/**
 * Component for displaying a list of available lobbies for a facility
 */
export function LobbyList({ lobbies, onJoinLobby, isLoading = false }: LobbyListProps) {
  // If no lobbies are found, display a message
  if (!lobbies || lobbies.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No open lobbies found</h3>
        <p className="text-gray-500 mb-6">Be the first to create a lobby for this facility!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lobbies.map((lobby) => (
        <Card key={lobby.id} className="overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between">
              {/* Lobby details */}
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900 mr-3">
                    {formatDate(lobby.date)}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {lobby.current_players}/{lobby.min_players} Players
                  </span>
                </div>
                
                <div className="text-sm text-gray-500 space-y-1">
                  <p>
                    <span className="font-medium">Time:</span> {formatTime(lobby.start_time)} - {formatTime(lobby.end_time)}
                  </p>
                  <p>
                    <span className="font-medium">Created by:</span> {lobby.creator_email || 'Unknown'}
                  </p>
                  {lobby.notes && (
                    <p>
                      <span className="font-medium">Notes:</span> {lobby.notes}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Lobby actions */}
              <div className="flex flex-col space-y-2">
                {onJoinLobby && (
                  <Button 
                    onClick={() => onJoinLobby(lobby.id)} 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Join Lobby'}
                  </Button>
                )}
                
                <Link href={`/lobbies/${lobby.id}`}>
                  <Button variant="outline" fullWidth size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}