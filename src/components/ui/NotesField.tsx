// src/components/ui/NotesField.tsx
import React from "react";

interface NotesFieldProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
  id?: string;
}

/**
 * Reusable notes/comments text area with consistent styling
 */
export function NotesField({
  label = "Notes (optional)",
  value,
  onChange,
  rows = 3,
  placeholder = "Any special requests or additional information",
  className = "",
  id = "notes",
}: NotesFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>
  );
}
