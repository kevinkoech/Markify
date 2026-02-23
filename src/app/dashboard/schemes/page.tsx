import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { markingSchemes, units, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SchemesList } from "./schemes-list";

export default async function SchemesPage({
  searchParams,
}: {
  searchParams: Promise<{ unitId?: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    redirect("/login");
  }

  const params = await searchParams;
  const filterUnitId = params.unitId ? parseInt(params.unitId) : undefined;

  // Get all marking schemes with unit and creator info
  let schemesData = await db
    .select({
      id: markingSchemes.id,
      name: markingSchemes.name,
      description: markingSchemes.description,
      version: markingSchemes.version,
      totalMarks: markingSchemes.totalMarks,
      markingMode: markingSchemes.markingMode,
      isActive: markingSchemes.isActive,
      createdAt: markingSchemes.createdAt,
      unitId: markingSchemes.unitId,
      unitName: units.name,
      unitCode: units.code,
      createdByName: users.name,
    })
    .from(markingSchemes)
    .leftJoin(units, eq(markingSchemes.unitId, units.id))
    .leftJoin(users, eq(markingSchemes.createdBy, users.id))
    .orderBy(desc(markingSchemes.createdAt));

  // Filter by unit if specified
  if (filterUnitId) {
    schemesData = schemesData.filter((s) => s.unitId === filterUnitId);
  }

  // Get all units for filtering
  const unitsData = await db
    .select({ id: units.id, name: units.name, code: units.code })
    .from(units);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marking Schemes</h1>
          <p className="text-gray-600">Manage marking schemes for automated assessment</p>
        </div>
        <a
          href="/dashboard/schemes/new"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Scheme
        </a>
      </div>

      <SchemesList
        schemes={schemesData}
        units={unitsData}
        filterUnitId={filterUnitId}
      />
    </div>
  );
}
