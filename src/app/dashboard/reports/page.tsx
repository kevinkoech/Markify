import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { submissions, results, units, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { ReportsDashboard } from "./reports-dashboard";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    redirect("/login");
  }

  // Get all results with related data
  const resultsData = await db
    .select({
      id: results.id,
      submissionId: results.submissionId,
      traineeId: results.traineeId,
      traineeName: users.name,
      traineeEmail: users.email,
      unitId: results.unitId,
      unitName: units.name,
      unitCode: units.code,
      totalMarks: results.totalMarks,
      maxMarks: results.maxMarks,
      percentage: results.percentage,
      isCompetent: results.isCompetent,
      metExpectation: results.metExpectation,
      markedAt: results.markedAt,
    })
    .from(results)
    .leftJoin(users, eq(results.traineeId, users.id))
    .leftJoin(units, eq(results.unitId, units.id))
    .orderBy(desc(results.markedAt));

  // Calculate statistics
  const stats = {
    totalResults: resultsData.length,
    competentCount: resultsData.filter((r) => r.isCompetent).length,
    notCompetentCount: resultsData.filter((r) => !r.isCompetent).length,
    averageScore: resultsData.length > 0
      ? Math.round(resultsData.reduce((sum, r) => sum + r.percentage, 0) / resultsData.length)
      : 0,
    metExpectationCount: resultsData.filter((r) => r.metExpectation).length,
  };

  // Get unit performance
  const unitPerformance = await db
    .select({
      unitId: units.id,
      unitName: units.name,
      unitCode: units.code,
      totalSubmissions: sql<number>`count(${results.id})`,
      averageScore: sql<number>`avg(${results.percentage})`,
      competentCount: sql<number>`sum(case when ${results.isCompetent} = 1 then 1 else 0 end)`,
    })
    .from(units)
    .leftJoin(results, eq(units.id, results.unitId))
    .groupBy(units.id)
    .having(sql`count(${results.id}) > 0`);

  // Get all units for filtering
  const unitsData = await db
    .select({ id: units.id, name: units.name, code: units.code })
    .from(units);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">View performance reports and export data</p>
        </div>
      </div>

      <ReportsDashboard
        results={resultsData}
        stats={stats}
        unitPerformance={unitPerformance}
        units={unitsData}
      />
    </div>
  );
}
