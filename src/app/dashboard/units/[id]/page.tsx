import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { units, users, markingSchemes, submissions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    redirect("/login");
  }

  const { id } = await params;
  const unitId = parseInt(id);

  if (isNaN(unitId)) {
    notFound();
  }

  // Get the unit with trainer info
  const unit = await db.query.units.findFirst({
    where: eq(units.id, unitId),
    with: {
      trainer: true,
    },
  });

  if (!unit) {
    notFound();
  }

  // Get marking schemes for this unit
  const schemes = await db
    .select()
    .from(markingSchemes)
    .where(eq(markingSchemes.unitId, unitId))
    .orderBy(desc(markingSchemes.createdAt));

  // Get recent submissions for this unit
  const recentSubmissions = await db
    .select({
      id: submissions.id,
      fileName: submissions.originalFileName,
      status: submissions.status,
      uploadedAt: submissions.uploadedAt,
      traineeName: users.name,
    })
    .from(submissions)
    .leftJoin(users, eq(submissions.traineeId, users.id))
    .where(eq(submissions.unitId, unitId))
    .orderBy(desc(submissions.uploadedAt))
    .limit(10);

  const markingTypeLabels: Record<string, string> = {
    engineering: "Engineering (Technical)",
    theoretical: "Theoretical (Conceptual)",
    mixed: "Mixed (Weighted)",
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/units"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Units
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                {unit.code}
              </span>
              {!unit.isActive && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  Inactive
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{unit.name}</h1>
            {unit.description && (
              <p className="text-gray-600 mt-2">{unit.description}</p>
            )}
          </div>
          <Link
            href={`/dashboard/units/${unit.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Unit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Unit Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900">{unit.department || "Not specified"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Marking Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{markingTypeLabels[unit.markingType || "engineering"]}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Marks</dt>
                <dd className="mt-1 text-sm text-gray-900">{unit.totalMarks || 100}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Passing Marks</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {unit.passingMarks || 50} ({unit.totalMarks ? Math.round((unit.passingMarks || 50) / unit.totalMarks * 100) : 50}%)
                </dd>
              </div>
            </dl>
          </div>

          {/* Marking Schemes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Marking Schemes</h2>
              <Link
                href={`/dashboard/schemes/new?unitId=${unit.id}`}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                + Add Scheme
              </Link>
            </div>
            {schemes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No marking schemes yet.</p>
            ) : (
              <div className="space-y-3">
                {schemes.map((scheme) => (
                  <div
                    key={scheme.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{scheme.name}</p>
                      <p className="text-xs text-gray-500">v{scheme.version} • {scheme.totalMarks} marks</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        scheme.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {scheme.isActive ? "Active" : "Inactive"}
                      </span>
                      <Link
                        href={`/dashboard/schemes/${scheme.id}/edit`}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
              <Link
                href={`/dashboard/submissions?unitId=${unit.id}`}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                View All
              </Link>
            </div>
            {recentSubmissions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sub.fileName}</p>
                      <p className="text-xs text-gray-500">{sub.traineeName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded ${
                        sub.status === "marked" ? "bg-green-100 text-green-700" :
                        sub.status === "waiting" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trainer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Trainer</h2>
            {unit.trainer ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {unit.trainer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{unit.trainer.name}</p>
                  <p className="text-xs text-gray-500">{unit.trainer.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No trainer assigned</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href={`/dashboard/schemes/new?unitId=${unit.id}`}
                className="flex items-center text-sm text-gray-700 hover:text-indigo-600"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Marking Scheme
              </Link>
              <Link
                href={`/dashboard/submissions?unitId=${unit.id}`}
                className="flex items-center text-sm text-gray-700 hover:text-indigo-600"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Submissions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
