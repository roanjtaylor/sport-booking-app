// src/components/auth/LoginForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthForm, AuthFieldConfig } from "@/components/auth/AuthForm";
import { authApi } from "@/lib/api";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await authApi.signIn(email, password);
      if (error) throw new Error(error.message);
      if (!data || !data.user) throw new Error("Failed to sign in");

      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const fields: AuthFieldConfig[] = [
    {
      label: "Email address",
      name: "email",
      type: "email",
      value: email,
      onChange: (e) => setEmail(e.target.value),
      required: true,
    },
    {
      label: "Password",
      name: "password",
      type: "password",
      value: password,
      onChange: (e) => setPassword(e.target.value),
      required: true,
    },
  ];

  return (
    <AuthForm
      title="Log In"
      fields={fields}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      submitText="Sign in"
    >
      <div className="flex justify-between mt-2">
        <Link
          href="/auth/reset-password"
          className="text-primary-600 hover:text-primary-500 text-sm"
        >
          Forgot your password?
        </Link>
      </div>

      <div className="text-center text-sm text-gray-500 mt-4">
        Don't have an account?{" "}
        <Link
          href="/auth/register"
          className="text-primary-600 hover:text-primary-500"
        >
          Sign up
        </Link>
      </div>
    </AuthForm>
  );
}
