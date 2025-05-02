// src/components/ui/DatePickerField.tsx
import React from "react";

interface DatePickerFieldProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  className?: string;
  error?: string;
  id?: string;
}

/**
 * Reusable date picker field with consistent styling and validation
 */
export function DatePickerField({
  label = "Date",
  value,
  onChange,
  minDate,
  maxDate,
  required = true,
  className = "",
  error,
  id = "date",
}: DatePickerFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="date"
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        min={minDate}
        max={maxDate}
        required={required}
        className={`block w-full rounded-md shadow-sm ${
          error
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
