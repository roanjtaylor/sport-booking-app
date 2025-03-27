// src/types/user.ts
/**
 * Represents a user in the system
 */
export type User = {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

/**
 * Available user roles in the system
 */
export type UserRole = "user" | "facility_owner";
