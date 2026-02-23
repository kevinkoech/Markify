import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { units } from "@/db/schema";
import { SchemeForm } from "./scheme-form";

export default async function NewSchemePage() {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    redirect("/login");
  }

  // Get all units for selection
  const unitsData = await db
    .select({ id: units.id, name: units.name, code: units.code })
    .from(units);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Marking Scheme</h1>
        <p className="text-gray-600">Create a marking scheme for automated assessment</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <SchemeForm units={unitsData} userId={user.id} />
      </div>
    </div>
  );
}
