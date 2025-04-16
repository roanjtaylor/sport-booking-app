// src/types/facility.ts
/**
 * Represents a sports facility
 */
export type Facility = {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string; // Changed to match snake_case from database
  country: string;
  imageUrl?: string;
  owner_id: string; // Changed to match snake_case from database
  owner_email: string; // Changed to match snake_case from database
  operatingHours: OperatingHours;
  price_per_hour: number; // Changed to match snake_case from database
  currency: string;
  sportType: string[];
  amenities: string[];
  min_players: number; // Minimum number of players needed for a lobby booking
  latitude?: number;
  longitude?: number;
};

/**
 * Operating hours for each day of the week
 */
export type OperatingHours = {
  monday: TimeRange | null;
  tuesday: TimeRange | null;
  wednesday: TimeRange | null;
  thursday: TimeRange | null;
  friday: TimeRange | null;
  saturday: TimeRange | null;
  sunday: TimeRange | null;
};

/**
 * Represents a time range with open and close times in 24-hour format
 */
export type TimeRange = {
  open: string; // Format: "HH:MM"
  close: string; // Format: "HH:MM"
};

/**
 * Types of sports supported by facilities
 */
export type SportType =
  | "football"
  | "indoors"
  | "outdoors"
  | "11 aside"
  | "7 aside"
  | "5 aside";
