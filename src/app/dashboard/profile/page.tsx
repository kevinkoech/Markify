"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, updateProfile, changePassword } from "@/app/actions/auth";

interface UserData {
  id: number;
  email: string;
  name: string;
  role: string;
  department: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const userData = await getAuthUser();
      if (!userData) {
        router.push("/login");
        return;
      }
      setUser(userData);
      setLoading(false);
    }
    loadUser();
  }, [router]);

  async function handleProfileUpdate(formData: FormData) {
    setProfileError(null);
    setProfileSuccess(false);
    setUpdatingProfile(true);

    try {
      const result = await updateProfile(formData);
      if (result.success && result.user) {
        setUser(result.user);
        setProfileSuccess(true);
      } else {
        setProfileError(result.error || "Failed to update profile");
      }
    } catch {
      setProfileError("An unexpected error occurred");
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function handlePasswordChange(formData: FormData) {
    setPasswordError(null);
    setPasswordSuccess(false);
    setUpdatingPassword(true);

    try {
      const result = await changePassword(formData);
      if (result.success) {
        setPasswordSuccess(true);
        // Clear the form
        const form = document.getElementById("password-form") as HTMLFormElement;
        form?.reset();
      } else {
        setPasswordError(result.error || "Failed to change password");
      }
    } catch {
      setPasswordError("An unexpected error occurred");
    } finally {
      setUpdatingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    trainer: "Trainer",
    trainee: "Trainee",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Role</label>
            <p className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {roleLabels[user.role] || user.role}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Profile Update Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Details</h2>
        
        {profileError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {profileError}
          </div>
        )}
        
        {profileSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
            Profile updated successfully!
          </div>
        )}

        <form action={handleProfileUpdate} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              defaultValue={user.name}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <input
              type="text"
              name="department"
              id="department"
              defaultValue={user.department || ""}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              placeholder="e.g., Mechanical Engineering"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={updatingProfile}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {updatingProfile ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
        
        {passwordError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {passwordError}
          </div>
        )}
        
        {passwordSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
            Password changed successfully!
          </div>
        )}

        <form id="password-form" action={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              id="currentPassword"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              id="newPassword"
              required
              minLength={8}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              required
              minLength={8}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={updatingPassword}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {updatingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}