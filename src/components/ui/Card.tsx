// src/components/ui/Card.tsx
import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

/**
 * Card component for containing content in a bordered box with shadow
 */
export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div 
      className={`bg-white rounded-lg shadow overflow-hidden ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined} // Role for accessibility
      tabIndex={onClick ? 0 : undefined} // Focusable if clickable
    >
      {children}
    </div>
  );
}