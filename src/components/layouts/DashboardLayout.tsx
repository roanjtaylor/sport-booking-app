// src/components/layouts/DashboardLayout.tsx
import React from "react";

interface DashboardLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Reusable dashboard layout component
 * Provides consistent header structure with title, description, and action buttons
 */
export function DashboardLayout({
  title,
  description,
  actions,
  children,
}: DashboardLayoutProps) {
  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
        {actions && <div className="flex space-x-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
