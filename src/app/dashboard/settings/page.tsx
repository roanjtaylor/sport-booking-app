// src/app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { UserRole } from "@/types/user";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { authApi, usersApi } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [profile, setProfile] = useState({
    id: "",
    name: "",
    email: "",
    role: "user" as UserRole,
  });

  // Fetch user profile on component mount
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setIsLoading(true);

        // Get current authenticated user
        const { data: user, error: userError } = await authApi.getCurrentUser();

        if (userError || !user) {
          router.push("/auth/login?redirect=/dashboard/settings");
          return;
        }

        // Get profile data using the API
        const { data, error: profileError } = await usersApi.getUserProfile(
          user.id
        );

        if (profileError) throw profileError;

        if (data) {
          setProfile({
            id: data.id,
            name: data.name || "",
            email: user.email || "",
            role: data.role as UserRole,
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load your profile information");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserProfile();
  }, [router]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      // Get current user
      const { data: user, error: userError } = await authApi.getCurrentUser();

      if (userError || !user) {
        throw new Error("You must be logged in to update your profile");
      }

      // Update profile information
      const { error: updateError } = await usersApi.updateUserProfile(user.id, {
        name: profile.name,
      });

      if (updateError) throw updateError;

      // If email has changed, update auth email
      if (profile.email !== user.email) {
        const { error: emailError } = await authApi.updateEmail(profile.email);

        if (emailError) throw emailError;
      }

      setSuccessMessage("Profile updated successfully");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      // Sign out the user
      await authApi.signOut();

      // Redirect to home page with message
      alert(
        "Your account deletion request has been submitted. An administrator will process your request."
      );
      router.push("/");
    } catch (err: any) {
      console.error("Error deleting account:", err);
      setError(err.message || "Failed to delete account");
      setIsDeleting(false);
    }
  };

  // The rest of the component (UI rendering) remains the same
  if (isLoading) {
    return <LoadingIndicator message="" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Component JSX remains the same */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-primary-600 hover:underline inline-flex items-center"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-2">Settings</h1>
        <p className="text-gray-600">
          Manage your profile and account preferences
        </p>
      </div>

      <ErrorDisplay error={error} className="mb-6" />

      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar navigation */}
        <div className="md:col-span-1">
          <Card className="p-4 sticky top-4">
            <nav>
              <ul className="space-y-1">
                <li>
                  <a
                    href="#profile"
                    className="block px-4 py-2 rounded-md text-primary-600 bg-primary-50 font-medium"
                  >
                    Profile Information
                  </a>
                </li>
                <li>
                  <a
                    href="#account"
                    className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Account Management
                  </a>
                </li>
              </ul>
            </nav>
          </Card>
        </div>

        {/* Main content */}
        <div className="md:col-span-2 space-y-8">
          {/* Profile Information Section */}
          <Card id="profile" className="p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                value={profile.name}
                onChange={handleChange}
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                required
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <p className="block p-2 rounded-md bg-gray-50 border border-gray-200">
                  {profile.role === "facility_owner"
                    ? "Facility Owner"
                    : "Regular User"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Account type cannot be changed directly. Please contact
                  support if you need to change your account type.
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Account Management Section */}
          <Card id="account" className="p-6">
            <h2 className="text-xl font-semibold mb-4">Account Management</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Change Password</h3>
                <p className="text-gray-600 mb-4">
                  Update your password for increased security
                </p>
                <Link href="/auth/reset-password">
                  <Button variant="secondary">Change Password</Button>
                </Link>
              </div>

              <hr className="my-6" />

              <div>
                <h3 className="text-lg font-medium mb-2 text-red-600">
                  Delete Account
                </h3>
                <p className="text-gray-600 mb-4">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                  <Button
                    variant="danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </Button>
                ) : (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-700 font-medium mb-4">
                      Are you absolutely sure you want to delete your account?
                      This action cannot be undone.
                    </p>
                    <div className="flex space-x-4">
                      <Button
                        variant="danger"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
