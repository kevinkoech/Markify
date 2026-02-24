"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { results, submissions, notifications, auditLogs, users, units } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function submitMarks(formData: FormData) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  const submissionId = parseInt(formData.get("submissionId") as string);
  const traineeId = parseInt(formData.get("traineeId") as string);
  const unitId = parseInt(formData.get("unitId") as string);
  const totalMarks = parseInt(formData.get("totalMarks") as string);
  const maxMarks = parseInt(formData.get("maxMarks") as string);
  const percentage = parseInt(formData.get("percentage") as string);
  const isCompetent = formData.get("isCompetent") === "true";
  const metExpectation = formData.get("metExpectation") === "true";
  const feedback = formData.get("feedback") as string;
  const questionResults = formData.get("questionResults") as string;
  const markedBy = parseInt(formData.get("markedBy") as string);

  if (!submissionId || !traineeId || !unitId) {
    return { success: false, error: "Missing required fields" };
  }

  try {
    // Check if result already exists
    const existingResult = await db.query.results.findFirst({
      where: eq(results.submissionId, submissionId),
    });

    let result;
    if (existingResult) {
      // Update existing result
      [result] = await db
        .update(results)
        .set({
          totalMarks,
          maxMarks,
          percentage,
          isCompetent,
          metExpectation,
          feedback: feedback || null,
          questionResults: questionResults ? JSON.parse(questionResults) : null,
          markedBy,
          markedAt: new Date(),
          overriddenBy: user.id,
          overriddenAt: new Date(),
        })
        .where(eq(results.id, existingResult.id))
        .returning();
    } else {
      // Create new result
      [result] = await db
        .insert(results)
        .values({
          submissionId,
          traineeId,
          unitId,
          totalMarks,
          maxMarks,
          percentage,
          isCompetent,
          metExpectation,
          feedback: feedback || null,
          questionResults: questionResults ? JSON.parse(questionResults) : null,
          markedBy,
        })
        .returning();
    }

    // Update submission status
    await db
      .update(submissions)
      .set({
        status: "marked",
        markedAt: new Date(),
        markedBy: user.id,
      })
      .where(eq(submissions.id, submissionId));

    // Create notification for trainee
    await db.insert(notifications).values({
      userId: traineeId,
      type: "marking_complete",
      title: "Assignment Marked",
      message: `Your assignment has been marked. Score: ${percentage}%`,
      relatedId: submissionId,
    });

    // Send email notification to trainee
    const trainee = await db.query.users.findFirst({
      where: eq(users.id, traineeId),
    });
    const unit = await db.query.units.findFirst({
      where: eq(units.id, unitId),
    });

    if (trainee && unit) {
      const markingTemplate = emailTemplates.marking_complete({
        traineeName: trainee.name,
        unitName: unit.name,
        score: totalMarks,
        maxScore: maxMarks,
        percentage,
        isCompetent,
      });
      await sendEmail(trainee.email, markingTemplate);
    }

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: existingResult ? "update_marks" : "submit_marks",
      entityType: "result",
      entityId: result.id,
      details: { submissionId, percentage, isCompetent },
    });

    revalidatePath("/dashboard/submissions");
    revalidatePath(`/dashboard/submissions/${submissionId}`);
    return { success: true, resultId: result.id };
  } catch (error) {
    console.error("Submit marks error:", error);
    return { success: false, error: "Failed to submit marks" };
  }
}

export async function overrideMarks(
  resultId: number,
  data: {
    totalMarks: number;
    maxMarks: number;
    feedback?: string;
  }
) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await db.query.results.findFirst({
      where: eq(results.id, resultId),
    });

    if (!result) {
      return { success: false, error: "Result not found" };
    }

    const percentage = Math.round((data.totalMarks / data.maxMarks) * 100);
    const isCompetent = percentage >= 50;

    await db
      .update(results)
      .set({
        totalMarks: data.totalMarks,
        maxMarks: data.maxMarks,
        percentage,
        isCompetent,
        feedback: data.feedback || null,
        overriddenBy: user.id,
        overriddenAt: new Date(),
      })
      .where(eq(results.id, resultId));

    // Log the override
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "override_marks",
      entityType: "result",
      entityId: resultId,
      details: { newPercentage: percentage },
    });

    revalidatePath("/dashboard/submissions");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to override marks" };
  }
}

export async function getResult(resultId: number) {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const result = await db.query.results.findFirst({
    where: eq(results.id, resultId),
    with: {
      submission: true,
      trainee: true,
      unit: true,
    },
  });

  // Check access
  if (user.role === "trainee" && result?.traineeId !== user.id) {
    return null;
  }

  return result;
}
