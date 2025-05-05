// src/components/auth/RegisterForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { UserRole } from "@/types/user";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { authApi } from "@/lib/api";

/**
 * Registration form component for new user sign-up
 */
export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Use the API service for signup and automatic signin
      const { data, error: signUpError } = await authApi.signUpAndSignIn(
        email,
        password,
        name,
        role
      );

      if (signUpError) throw new Error(signUpError.message);
      if (!data || !data.user) throw new Error("Registration failed");

      // Success - redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: "user", label: "Regular User" },
    { value: "facility_owner", label: "Facility Owner" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display error message if there is one */}
      <ErrorDisplay error={error} className="mb-6" />

      <Input
        label="Email address"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Full name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Select
        label="Account type"
        name="role"
        options={roleOptions}
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
        required
      />

      <Input
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Input
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? "Creating account..." : "Sign up"}
      </Button>

      <div className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-primary-600 hover:text-primary-500"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
