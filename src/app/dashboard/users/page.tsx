import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { UsersList } from "./users-list";

export default async function UsersPage() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  // Get all users
  const usersData = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      department: users.department,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        <a
          href="/dashboard/users/new"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </a>
      </div>

      <UsersList users={usersData} />
    </div>
  );
}
