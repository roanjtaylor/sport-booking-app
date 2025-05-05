// src/components/auth/AuthForm.tsx
import React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";

export type AuthFieldConfig = {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  error?: string;
};

type AuthFormProps = {
  title: string;
  fields: AuthFieldConfig[];
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  submitText?: string;
  children?: React.ReactNode;
};

export function AuthForm({
  title,
  fields,
  onSubmit,
  isLoading,
  error,
  submitText,
  children,
}: AuthFormProps) {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">{title}</h1>

      <ErrorDisplay error={error} className="mb-6" />

      <form onSubmit={onSubmit} className="space-y-4">
        {fields.map((field) =>
          field.options ? (
            <Select
              key={field.name}
              label={field.label}
              name={field.name}
              options={field.options}
              value={field.value}
              onChange={field.onChange}
              required={field.required}
              error={field.error}
            />
          ) : (
            <Input
              key={field.name}
              label={field.label}
              name={field.name}
              type={field.type || "text"}
              value={field.value}
              onChange={field.onChange}
              required={field.required}
              placeholder={field.placeholder}
              error={field.error}
            />
          )
        )}

        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? "Processing..." : submitText || title}
        </Button>

        {children}
      </form>
    </div>
  );
}
