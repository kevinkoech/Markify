import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { submissions, units, users, results } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SubmissionDetail } from "./submission-detail";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
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

  // Check access
  if (user.role === "trainee" && submission.traineeId !== user.id) {
    notFound();
  }

  // Get trainee info
  const trainee = await db.query.users.findFirst({
    where: eq(users.id, submission.traineeId),
  });

  // Get result if exists
  const result = await db.query.results.findFirst({
    where: eq(results.submissionId, submissionId),
  });

  // Convert undefined to null for type safety
  const traineeData = trainee ?? null;
  const resultData = result ?? null;

  return (
    <SubmissionDetail
      submission={submission}
      unit={submission.unit}
      trainee={traineeData}
      result={resultData}
      userRole={user.role}
      currentUserId={user.id}
    />
  );
}
