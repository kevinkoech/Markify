"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/app/actions/users";

interface UserFormProps {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    department: string | null;
  };
}

export function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      const result = await createUser(formData);

      if (result.success) {
        router.push("/dashboard/users");
        router.refresh();
      } else {
        setError(result.error || "Failed to create user");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {user && <input type="hidden" name="userId" value={user.id} />}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={user?.name || ""}
          required
          placeholder="e.g., John Doe"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          defaultValue={user?.email || ""}
          required
          placeholder="e.g., john@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {!user && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required={!user}
            minLength={8}
            placeholder="Minimum 8 characters"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      )}

      {user && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            New Password (leave blank to keep current)
          </label>
          <input
            type="password"
            id="password"
            name="password"
            minLength={8}
            placeholder="Minimum 8 characters"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      )}

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          Role *
        </label>
        <select
          id="role"
          name="role"
          defaultValue={user?.role || "trainee"}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="trainee">Trainee</option>
          <option value="trainer">Trainer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
          Department
        </label>
        <input
          type="text"
          id="department"
          name="department"
          defaultValue={user?.department || ""}
          placeholder="e.g., Mechanical Engineering"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : user ? "Update User" : "Create User"}
        </button>
      </div>
    </form>
  );
}
