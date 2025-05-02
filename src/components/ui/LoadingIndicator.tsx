// src/components/ui/LoadingIndicator.tsx
import React from "react";

interface LoadingIndicatorProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Reusable loading indicator with spinner and optional message
 */
export function LoadingIndicator({
  message = "Loading...",
  size = "md",
  className = "",
}: LoadingIndicatorProps) {
  // Size variants for spinner
  const spinnerSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  // Size variants for container padding
  const containerPadding = {
    sm: "py-4",
    md: "py-8",
    lg: "py-12",
  };

  // Size variants for text
  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div
      className={`flex justify-center items-center ${containerPadding[size]} ${className}`}
    >
      <div className="text-center">
        <div
          className={`animate-spin rounded-full ${spinnerSizes[size]} border-b-2 border-primary-600 mx-auto`}
          aria-hidden="true"
        ></div>
        {message && (
          <p className={`mt-4 text-gray-600 ${textSizes[size]}`} role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
