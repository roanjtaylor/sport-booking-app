// src/components/auth/RegisterForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthForm, AuthFieldConfig } from "@/components/auth/AuthForm";
import { UserRole } from "@/types/user";
import { authApi } from "@/lib/api";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: signUpError } = await authApi.signUpAndSignIn(
        email,
        password,
        name,
        role
      );

      if (signUpError) throw new Error(signUpError.message);
      if (!data || !data.user) throw new Error("Registration failed");

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create account");
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
      label: "Full name",
      name: "name",
      value: name,
      onChange: (e) => setName(e.target.value),
      required: true,
    },
    {
      label: "Account type",
      name: "role",
      value: role,
      onChange: (e) => setRole(e.target.value as UserRole),
      required: true,
      options: [
        { value: "user", label: "Regular User" },
        { value: "facility_owner", label: "Facility Owner" },
      ],
    },
    {
      label: "Password",
      name: "password",
      type: "password",
      value: password,
      onChange: (e) => setPassword(e.target.value),
      required: true,
    },
    {
      label: "Confirm Password",
      name: "confirmPassword",
      type: "password",
      value: confirmPassword,
      onChange: (e) => setConfirmPassword(e.target.value),
      required: true,
    },
  ];

  return (
    <AuthForm
      title="Create an Account"
      fields={fields}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      submitText="Sign up"
    >
      <div className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-primary-600 hover:text-primary-500"
        >
          Sign in
        </Link>
      </div>
    </AuthForm>
  );
}
