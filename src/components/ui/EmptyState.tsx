// src/components/ui/EmptyState.tsx
import React, { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLink?: string;
  actionText?: string;
  icon?: ReactNode;
  className?: string;
  variant?: "default" | "compact" | "expanded";
}

/**
 * Reusable empty state component to display when no data is available
 */
export function EmptyState({
  title,
  message,
  actionLink,
  actionText,
  icon,
  className = "",
  variant = "default",
}: EmptyStateProps) {
  // Size variants based on the variant prop
  const variantClasses = {
    compact: "py-6",
    default: "py-8",
    expanded: "py-12",
  };

  return (
    <div className={`text-center ${variantClasses[variant]} ${className}`}>
      {icon && <div className="mb-4">{icon}</div>}

      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>

      {message && <p className="text-gray-500 mb-6">{message}</p>}

      {actionLink && actionText && (
        <Link href={actionLink}>
          <Button>{actionText}</Button>
        </Link>
      )}
    </div>
  );
}
