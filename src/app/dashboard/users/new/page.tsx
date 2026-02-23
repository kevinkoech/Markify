import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserForm } from "./user-form";

export default async function NewUserPage() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
        <p className="text-gray-600">Create a new user account</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <UserForm />
      </div>
    </div>
  );
}
