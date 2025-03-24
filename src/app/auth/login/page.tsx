// src/app/auth/login/page.tsx
import { LoginForm } from '@/components/auth/LoginForm';

/**
 * Page component for user login
 */
export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-gray-600 mt-2">
          Sign in to your account to manage your bookings
        </p>
      </div>
      
      {/* The LoginForm component handles all authentication logic */}
      <LoginForm />
    </div>
  );
}
