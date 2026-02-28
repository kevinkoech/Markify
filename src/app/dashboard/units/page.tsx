import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { units, users, markingSchemes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { UnitsList } from "./units-list";

export default async function UnitsPage() {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    redirect("/login");
  }

  // Get all units with trainer info
  const unitsData = await db
    .select({
      id: units.id,
      code: units.code,
      name: units.name,
      description: units.description,
      department: units.department,
      totalMarks: units.totalMarks,
      passingMarks: units.passingMarks,
      markingType: units.markingType,
      trainerId: units.trainerId,
      trainerName: users.name,
      isActive: units.isActive,
      createdAt: units.createdAt,
    })
    .from(units)
    .leftJoin(users, eq(units.trainerId, users.id))
    .orderBy(desc(units.createdAt));

  // Get marking schemes count for each unit
  const unitsWithSchemes = await Promise.all(
    unitsData.map(async (unit) => {
      const schemes = await db
        .select({ count: markingSchemes.id })
        .from(markingSchemes)
        .where(eq(markingSchemes.unitId, unit.id));
      return {
        ...unit,
        schemesCount: schemes.length,
      };
    })
  );

  // Get all trainers for assignment
  const trainers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "trainer"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Units / Subjects</h1>
          <p className="text-gray-600">Manage units and their marking schemes</p>
        </div>
        <Link
          href="/dashboard/units/new"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Unit
        </Link>
      </div>

      <UnitsList units={unitsWithSchemes} trainers={trainers} userRole={user.role} />
    </div>
  );
}
