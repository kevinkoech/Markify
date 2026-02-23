import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { submissions, units, users, results, markingSchemes } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { SubmissionsList } from "./submissions-list";

export default async function SubmissionsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  let submissionsData: any[] = [];

  if (user.role === "trainee") {
    // Get trainee's own submissions
    submissionsData = await db
      .select({
        id: submissions.id,
        fileName: submissions.originalFileName,
        fileType: submissions.fileType,
        fileSize: submissions.fileSize,
        status: submissions.status,
        uploadedAt: submissions.uploadedAt,
        markedAt: submissions.markedAt,
        unitId: submissions.unitId,
        unitName: units.name,
        unitCode: units.code,
        totalMarks: results.totalMarks,
        maxMarks: results.maxMarks,
        percentage: results.percentage,
        isCompetent: results.isCompetent,
        feedback: results.feedback,
      })
      .from(submissions)
      .leftJoin(units, eq(submissions.unitId, units.id))
      .leftJoin(results, eq(submissions.id, results.submissionId))
      .where(eq(submissions.traineeId, user.id))
      .orderBy(desc(submissions.uploadedAt));
  } else {
    // Trainers and admins see all submissions
    submissionsData = await db
      .select({
        id: submissions.id,
        fileName: submissions.originalFileName,
        fileType: submissions.fileType,
        fileSize: submissions.fileSize,
        status: submissions.status,
        uploadedAt: submissions.uploadedAt,
        markedAt: submissions.markedAt,
        unitId: submissions.unitId,
        unitName: units.name,
        unitCode: units.code,
        traineeId: submissions.traineeId,
        traineeName: users.name,
        traineeEmail: users.email,
        totalMarks: results.totalMarks,
        maxMarks: results.maxMarks,
        percentage: results.percentage,
        isCompetent: results.isCompetent,
        feedback: results.feedback,
      })
      .from(submissions)
      .leftJoin(units, eq(submissions.unitId, units.id))
      .leftJoin(users, eq(submissions.traineeId, users.id))
      .leftJoin(results, eq(submissions.id, results.submissionId))
      .orderBy(desc(submissions.uploadedAt));
  }

  // Get units for filtering
  const unitsData = await db
    .select({ id: units.id, name: units.name, code: units.code })
    .from(units);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-gray-600">
            {user.role === "trainee" ? "Your uploaded assignments" : "All submitted assignments"}
          </p>
        </div>
        {user.role === "trainee" && (
          <a
            href="/dashboard/upload"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload New
          </a>
        )}
      </div>

      <SubmissionsList
        submissions={submissionsData}
        units={unitsData}
        userRole={user.role}
      />
    </div>
  );
}
