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
  postalCode: string;
  country: string;
  imageUrl?: string;
  ownerId: string;
  operatingHours: OperatingHours;
  pricePerHour: number;
  currency: string;
  sportType: SportType[];
  amenities: string[];
  createdAt: string;
  updatedAt: string;
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
