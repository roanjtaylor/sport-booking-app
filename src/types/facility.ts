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
  postal_code: string;
  country: string;
  image_url?: string;
  owner_id: string;
  operating_hours: OperatingHours;
  price_per_hour: number;
  currency: string;
  sport_type: SportType[];
  amenities: string[];
  created_at: string;
  updated_at: string;
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
  | "basketball"
  | "tennis"
  | "volleyball"
  | "badminton"
  | "other";
