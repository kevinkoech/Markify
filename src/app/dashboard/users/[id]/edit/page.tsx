import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UserForm } from "../../new/user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const { id } = await params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    notFound();
  }

  // Get the user to edit
  const userToEdit = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!userToEdit) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
        <p className="text-gray-600">Update user account information</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <UserForm user={userToEdit} />
      </div>
    </div>
  );
}
