// src/app/auth/register/page.tsx
import { RegisterForm } from "@/components/auth/RegisterForm";

/**
 * Page component for user registration
 */
export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="text-gray-600 mt-2">
          Join us to book sports facilities or list your own
        </p>
      </div>

      {/* The RegisterForm component handles all registration logic */}
      <RegisterForm />
    </div>
  );
}
