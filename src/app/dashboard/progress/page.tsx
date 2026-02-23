import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { submissions, results, units, enrollments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProgressReport } from "./progress-report";

export default async function ProgressPage() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "trainee") {
    redirect("/login");
  }

  // Get all results for this trainee
  const resultsData = await db
    .select({
      id: results.id,
      submissionId: results.submissionId,
      unitId: results.unitId,
      unitName: units.name,
      unitCode: units.code,
      totalMarks: results.totalMarks,
      maxMarks: results.maxMarks,
      percentage: results.percentage,
      isCompetent: results.isCompetent,
      metExpectation: results.metExpectation,
      feedback: results.feedback,
      markedAt: results.markedAt,
    })
    .from(results)
    .leftJoin(units, eq(results.unitId, units.id))
    .where(eq(results.traineeId, user.id))
    .orderBy(desc(results.markedAt));

  // Get enrolled units
  const enrolledUnits = await db
    .select({
      id: units.id,
      name: units.name,
      code: units.code,
      totalMarks: units.totalMarks,
      passingMarks: units.passingMarks,
    })
    .from(units)
    .innerJoin(enrollments, eq(enrollments.unitId, units.id))
    .where(eq(enrollments.traineeId, user.id));

  // Calculate overall stats
  const stats = {
    totalSubmissions: resultsData.length,
    competentCount: resultsData.filter((r) => r.isCompetent).length,
    averageScore: resultsData.length > 0
      ? Math.round(resultsData.reduce((sum, r) => sum + r.percentage, 0) / resultsData.length)
      : 0,
    totalUnits: enrolledUnits.length,
    completedUnits: new Set(resultsData.filter((r) => r.isCompetent).map((r) => r.unitId)).size,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress Report</h1>
        <p className="text-gray-600">Track your learning progress and results</p>
      </div>

      <ProgressReport
        results={resultsData}
        enrolledUnits={enrolledUnits}
        stats={stats}
      />
    </div>
  );
}
