// src/components/auth/ResetPasswordForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthForm, AuthFieldConfig } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/Card";
import { authApi } from "@/lib/api";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get auth parameters from URL
  const type = searchParams?.get("type");
  const token = searchParams?.get("access_token") || searchParams?.get("token");
  const email = searchParams?.get("email");

  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [userEmail, setUserEmail] = useState(email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check for recovery mode on component mount
  useEffect(() => {
    if ((type === "recovery" || type === "password_reset") && token) {
      (async () => {
        try {
          const { error } = await authApi.setSession(token);
          if (error) {
            setError(
              "Invalid or expired reset link. Please request a new one."
            );
            setIsRecoveryMode(false);
          } else {
            setIsRecoveryMode(true);
          }
        } catch (err) {
          setError("Something went wrong. Please try again.");
          setIsRecoveryMode(false);
        }
      })();
    }
  }, [type, token]);

  // Request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const { success, error } = await authApi.resetPasswordRequest(userEmail);
      if (error) throw error;
      setSuccess("Password reset link has been sent to your email");
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email");
    } finally {
      setIsLoading(false);
    }
  };

  // Set new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
      const { error } = await authApi.updatePassword(password);
      if (error) throw error;

      setSuccess("Your password has been updated successfully");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  // Configure form based on mode
  let fields: AuthFieldConfig[] = [];
  let formTitle: string;
  let submitText: string;
  let formHandler: (e: React.FormEvent) => Promise<void>;

  if (isRecoveryMode) {
    fields = [
      {
        label: "New Password",
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
    formTitle = "Reset Your Password";
    submitText = "Update Password";
    formHandler = handleSetNewPassword;
  } else {
    fields = [
      {
        label: "Email address",
        name: "email",
        type: "email",
        value: userEmail,
        onChange: (e) => setUserEmail(e.target.value),
        required: true,
      },
    ];
    formTitle = "Reset Your Password";
    submitText = "Send Reset Link";
    formHandler = handleRequestReset;
  }

  return (
    <Card className="p-6">
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
          {success}
        </div>
      )}

      {isRecoveryMode ? (
        <p className="text-gray-700 mb-4">Enter your new password below:</p>
      ) : (
        <p className="text-gray-700 mb-4">
          Enter your email address below, and we'll send you a link to reset
          your password.
        </p>
      )}

      <AuthForm
        title={formTitle}
        fields={fields}
        onSubmit={formHandler}
        isLoading={isLoading}
        error={error}
        submitText={submitText}
      >
        {!isRecoveryMode && (
          <div className="text-center text-sm text-gray-500 mt-4">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </div>
        )}
      </AuthForm>
    </Card>
  );
}
