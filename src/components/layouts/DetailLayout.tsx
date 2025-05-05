// src/components/layouts/DetailLayout.tsx
import React from "react";
import Link from "next/link";

interface DetailLayoutProps {
  title: string;
  backLink: string;
  backText?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Reusable detail page layout component
 * Provides consistent header with back link, title, and optional actions
 */
export function DetailLayout({
  title,
  backLink,
  backText = "Back",
  actions,
  children,
}: DetailLayoutProps) {
  return (
    <div>
      <div className="mb-8">
        <Link
          href={backLink}
          className="text-primary-600 hover:underline inline-flex items-center"
        >
          ← {backText}
        </Link>
        <div className="flex justify-between items-center mt-2">
          <h1 className="text-3xl font-bold">{title}</h1>
          {actions && <div className="flex space-x-3">{actions}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}
