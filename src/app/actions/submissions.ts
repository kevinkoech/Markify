"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { submissions, markingSchemes, notifications, auditLogs, users, units } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";
import { sendEmail, emailTemplates } from "@/lib/email";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

export async function uploadSubmission(formData: FormData) {
  const user = await getCurrentUser();
  
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const file = formData.get("file") as File;
  const unitId = parseInt(formData.get("unitId") as string);

  if (!file || !unitId) {
    return { success: false, error: "File and unit are required" };
  }

  try {
    await ensureUploadDir();

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "bin";
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    // Determine file type
    const fileType = getFileType(fileExtension);

    // Create submission record
    const [submission] = await db
      .insert(submissions)
      .values({
        traineeId: user.id,
        unitId,
        fileName: uniqueFileName,
        originalFileName: file.name,
        filePath,
        fileType,
        fileSize: file.size,
        status: "uploaded",
      })
      .returning();

    // Get unit info for notifications
    const unit = await db.query.units.findFirst({
      where: eq(units.id, unitId),
    });

    // Create notification for trainee (upload confirmation)
    await db.insert(notifications).values({
      userId: user.id,
      type: "upload_confirmation",
      title: "Submission Uploaded Successfully",
      message: `Your submission "${file.name}" for ${unit?.name || "unit"} has been received.`,
      relatedId: submission.id,
    });

    // Send confirmation email to trainee
    const uploadTemplate = emailTemplates.upload_confirmation({
      traineeName: user.name,
      unitName: unit?.name || "Unknown Unit",
      fileName: file.name,
    });
    await sendEmail(user.email, uploadTemplate);

    // Create notification for trainers
    await createNotificationForTrainers(unitId, user.name, file.name);

    // Log the upload
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "upload_submission",
      entityType: "submission",
      entityId: submission.id,
      details: { fileName: file.name, unitId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/submissions");

    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Failed to upload file" };
  }
}

function getFileType(extension: string): string {
  const types: Record<string, string> = {
    doc: "word",
    docx: "word",
    ppt: "powerpoint",
    pptx: "powerpoint",
    pdf: "pdf",
  };
  return types[extension.toLowerCase()] || "unknown";
}

async function createNotificationForTrainers(unitId: number, traineeName: string, fileName: string) {
  // Get unit info
  const unit = await db.query.units.findFirst({
    where: eq(units.id, unitId),
  });

  // Get all trainers
  const trainersList = await db
    .select()
    .from(users)
    .where(eq(users.role, "trainer"));

  for (const trainer of trainersList) {
    // Create in-app notification
    await db.insert(notifications).values({
      userId: trainer.id,
      type: "new_submission",
      title: "New Submission Received",
      message: `${traineeName} submitted ${fileName}${unit ? ` for ${unit.name}` : ""}`,
      relatedId: unitId,
    });

    // Send email notification
    const template = emailTemplates.new_submission({
      trainerName: trainer.name,
      traineeName,
      unitName: unit?.name || "Unknown Unit",
      fileName,
    });
    await sendEmail(trainer.email, template);
  }
}

export async function getSubmissions(filters?: {
  unitId?: number;
  status?: string;
  traineeId?: number;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    return [];
  }

  // Build the base query conditions
  const conditions = [];
  
  // Apply role-based filtering
  if (user.role === "trainee") {
    conditions.push(eq(submissions.traineeId, user.id));
  }

  // Apply additional filters
  if (filters?.unitId) {
    conditions.push(eq(submissions.unitId, filters.unitId));
  }
  if (filters?.status) {
    conditions.push(eq(submissions.status, filters.status as any));
  }
  if (filters?.traineeId && (user.role === "trainer" || user.role === "admin")) {
    conditions.push(eq(submissions.traineeId, filters.traineeId));
  }

  const results = await db
    .select({
      id: submissions.id,
      fileName: submissions.originalFileName,
      filePath: submissions.filePath,
      fileType: submissions.fileType,
      fileSize: submissions.fileSize,
      status: submissions.status,
      uploadedAt: submissions.uploadedAt,
      markedAt: submissions.markedAt,
      unitId: submissions.unitId,
      traineeId: submissions.traineeId,
    })
    .from(submissions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(submissions.uploadedAt));

  return results;
}

export async function getSubmissionById(id: number) {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
    with: {
      unit: true,
    },
  });

  if (!submission) {
    return null;
  }

  // Check access
  if (user.role === "trainee" && submission.traineeId !== user.id) {
    return null;
  }

  return submission;
}

export async function updateSubmissionStatus(id: number, status: string) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  await db
    .update(submissions)
    .set({ 
      status: status as any,
      markedAt: status === "marked" ? new Date() : undefined,
      markedBy: status === "marked" ? user.id : undefined,
    })
    .where(eq(submissions.id, id));

  revalidatePath("/dashboard/submissions");
  return { success: true };
}

export async function deleteSubmission(id: number) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
  });

  if (!submission) {
    return { success: false, error: "Submission not found" };
  }

  // Delete file
  try {
    await fs.unlink(submission.filePath);
  } catch {
    // File might not exist
  }

  // Delete from database
  await db.delete(submissions).where(eq(submissions.id, id));

  revalidatePath("/dashboard/submissions");
  return { success: true };
}
