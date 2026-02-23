import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { submissions, units, users, markingSchemes, results } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MarkingForm } from "./marking-form";

export default async function MarkSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    redirect("/login");
  }

  const { id } = await params;
  const submissionId = parseInt(id);

  if (isNaN(submissionId)) {
    notFound();
  }

  // Get submission with related data
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      unit: true,
    },
  });

  if (!submission) {
    notFound();
  }

  // Get trainee info
  const traineeData = await db.query.users.findFirst({
    where: eq(users.id, submission.traineeId),
  });

  // Get marking schemes for this unit
  const schemes = await db
    .select()
    .from(markingSchemes)
    .where(eq(markingSchemes.unitId, submission.unitId));

  // Check if already marked
  const existingResultData = await db.query.results.findFirst({
    where: eq(results.submissionId, submissionId),
  });

  // Convert undefined to null for type safety
  const trainee = traineeData ?? null;
  const existingResult = existingResultData ? {
    ...existingResultData,
    metExpectation: existingResultData.metExpectation ?? false,
  } : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mark Submission</h1>
        <p className="text-gray-600">Review and mark the submitted assignment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main marking form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <MarkingForm
              submission={submission}
              trainee={trainee}
              schemes={schemes}
              existingResult={existingResult}
              markerId={user.id}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submission Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Submission Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">File</dt>
                <dd className="text-gray-900 font-medium">{submission.originalFileName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Unit</dt>
                <dd className="text-gray-900">{submission.unit?.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Uploaded</dt>
                <dd className="text-gray-900">
                  {submission.uploadedAt?.toLocaleDateString()} {submission.uploadedAt?.toLocaleTimeString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Trainee Info */}
          {trainee && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Trainee</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {trainee.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{trainee.name}</p>
                  <p className="text-xs text-gray-500">{trainee.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Marking Guide */}
          <div className="bg-indigo-50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-indigo-900 mb-2">Marking Guide</h3>
            <ul className="text-xs text-indigo-700 space-y-1">
              <li>✓ Tick = Correct answer</li>
              <li>✗ Cross = Wrong answer</li>
              <li>╱ Diagonal = No attempt</li>
              <li>≥ 50% = Competent</li>
              <li>&lt; 50% = Not Yet Competent</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
