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
          operating_hours: Json;
          price_per_hour: number;
          currency: string;
          sport_type: string[];
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
          operating_hours: Json;
          price_per_hour: number;
          currency: string;
          sport_type: string[];
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
          operating_hours?: Json;
          price_per_hour?: number;
          currency?: string;
          sport_type?: string[];
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
