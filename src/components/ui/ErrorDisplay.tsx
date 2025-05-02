// src/components/ui/ErrorDisplay.tsx
import React from "react";

interface ErrorDisplayProps {
  error: string | null;
  className?: string;
  compact?: boolean;
}

/**
 * Reusable error display component
 * Provides consistent styling for error messages across the application
 */
export function ErrorDisplay({
  error,
  className = "",
  compact = false,
}: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div
      className={`bg-red-50 text-red-700 ${
        compact ? "p-3 text-sm" : "p-4"
      } rounded-md ${className}`}
    >
      {error}
    </div>
  );
}
