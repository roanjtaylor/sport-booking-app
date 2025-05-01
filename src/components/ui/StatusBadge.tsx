// src/components/ui/StatusBadge.tsx
import React from "react";

export type StatusVariant =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "open"
  | "filled"
  | "expired"
  | "waiting"
  | "lobby"
  | "creator"
  | "group"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "default";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

/**
 * Reusable status badge component with standard styling
 */
export function StatusBadge({
  status,
  variant,
  className = "",
}: StatusBadgeProps) {
  // Default to using the status as the variant if not specified
  const badgeVariant =
    variant || (status?.toLowerCase() as StatusVariant) || "default";

  const variantClasses = {
    // Booking and lobby statuses
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-gray-100 text-gray-800",
    open: "bg-blue-100 text-blue-800",
    filled: "bg-green-100 text-green-800",
    expired: "bg-gray-100 text-gray-800",

    // Special statuses
    waiting: "bg-yellow-100 text-yellow-800",
    lobby: "bg-blue-100 text-blue-800",
    creator: "bg-purple-100 text-purple-800",
    group: "bg-blue-100 text-blue-800",

    // Basic semantic colors
    success: "bg-green-100 text-green-800",
    danger: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",

    // Default
    default: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        variantClasses[badgeVariant] || variantClasses.default
      } ${className}`}
    >
      {status}
    </span>
  );
}
