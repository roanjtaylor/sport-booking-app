// src/app/auth/reset-password/page.tsx
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

/**
 * Page component for password reset functionality
 * Handles both requesting a reset link and setting a new password
 */
export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">Reset Your Password</h1>
        <p className="text-gray-600 mt-2">
          Enter your email to receive a password reset link
        </p>
      </div>

      {/* The ResetPasswordForm component handles all password reset logic */}
      <ResetPasswordForm />
    </div>
  );
}
