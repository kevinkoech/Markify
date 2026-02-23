import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UnitForm } from "./unit-form";

export default async function NewUnitPage() {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    redirect("/login");
  }

  // Get all trainers for assignment
  const trainers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "trainer"));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Unit</h1>
        <p className="text-gray-600">Create a new unit/subject for assignments</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <UnitForm trainers={trainers} />
      </div>
    </div>
  );
}
