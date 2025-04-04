// src/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      facilities: {
        Row: {
          id: string;
          name: string;
          description: string;
          address: string;
          city: string;
          postal_code: string;
          country: string;
          image_url: string | null;
          owner_id: string;
          owner_email: string | null;
          operating_hours: Json;
          price_per_hour: number;
          currency: string;
          sport_type: string[];
          min_players: number | null;
          amenities: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          address: string;
          city: string;
          postal_code: string;
          country: string;
          image_url?: string | null;
          owner_id: string;
          owner_email?: string | null;
          operating_hours: Json;
          price_per_hour: number;
          currency: string;
          sport_type: string[];
          min_players?: number | null;
          amenities?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          address?: string;
          city?: string;
          postal_code?: string;
          country?: string;
          image_url?: string | null;
          owner_id?: string;
          owner_email?: string | null;
          operating_hours?: Json;
          price_per_hour?: number;
          currency?: string;
          sport_type?: string[];
          min_players?: number | null;
          amenities?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          facility_id: string;
          user_id: string;
          date: string;
          start_time: string;
          end_time: string;
          status: string;
          total_price: number;
          notes: string | null;
          lobby_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          facility_id: string;
          user_id: string;
          date: string;
          start_time: string;
          end_time: string;
          status: string;
          total_price: number;
          notes?: string | null;
          lobby_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          facility_id?: string;
          user_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          status?: string;
          total_price?: number;
          notes?: string | null;
          lobby_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          role: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      lobbies: {
        Row: {
          id: string;
          facility_id: string;
          creator_id: string;
          date: string;
          start_time: string;
          end_time: string;
          min_players: number;
          current_players: number;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          facility_id: string;
          creator_id: string;
          date: string;
          start_time: string;
          end_time: string;
          min_players: number;
          current_players?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          facility_id?: string;
          creator_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          min_players?: number;
          current_players?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lobby_participants: {
        Row: {
          id: string;
          lobby_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          lobby_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          lobby_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
