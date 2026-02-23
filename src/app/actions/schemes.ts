"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { markingSchemes, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createMarkingScheme(formData: FormData) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const unitId = parseInt(formData.get("unitId") as string);
  const markingMode = formData.get("markingMode") as string;
  const version = formData.get("version") as string;
  const totalMarks = parseInt(formData.get("totalMarks") as string) || 100;
  const questions = formData.get("questions") as string;

  if (!name || !unitId) {
    return { success: false, error: "Name and unit are required" };
  }

  try {
    // Parse and validate questions
    let schemeData: any = { questions: [] };
    if (questions) {
      schemeData = JSON.parse(questions);
    }

    const [scheme] = await db
      .insert(markingSchemes)
      .values({
        name,
        description: description || null,
        unitId,
        markingMode: markingMode as any,
        version: version || "1.0",
        totalMarks,
        schemeData,
        createdBy: user.id,
      })
      .returning();

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "create_marking_scheme",
      entityType: "marking_scheme",
      entityId: scheme.id,
      details: { name, unitId },
    });

    revalidatePath("/dashboard/schemes");
    return { success: true, schemeId: scheme.id };
  } catch (error) {
    console.error("Create scheme error:", error);
    return { success: false, error: "Failed to create marking scheme" };
  }
}

export async function updateMarkingScheme(formData: FormData) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  const schemeId = parseInt(formData.get("schemeId") as string);
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const markingMode = formData.get("markingMode") as string;
  const version = formData.get("version") as string;
  const totalMarks = parseInt(formData.get("totalMarks") as string) || 100;
  const questions = formData.get("questions") as string;

  if (!schemeId || !name) {
    return { success: false, error: "Scheme ID and name are required" };
  }

  try {
    // Parse and validate questions
    let schemeData: any = { questions: [] };
    if (questions) {
      schemeData = JSON.parse(questions);
    }

    await db
      .update(markingSchemes)
      .set({
        name,
        description: description || null,
        markingMode: markingMode as any,
        version: version || "1.0",
        totalMarks,
        schemeData,
      })
      .where(eq(markingSchemes.id, schemeId));

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "update_marking_scheme",
      entityType: "marking_scheme",
      entityId: schemeId,
      details: { name },
    });

    revalidatePath("/dashboard/schemes");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update marking scheme" };
  }
}

export async function deleteMarkingScheme(schemeId: number) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    return { success: false, error: "Only admins can delete marking schemes" };
  }

  try {
    const scheme = await db.query.markingSchemes.findFirst({
      where: eq(markingSchemes.id, schemeId),
    });

    if (!scheme) {
      return { success: false, error: "Marking scheme not found" };
    }

    await db.delete(markingSchemes).where(eq(markingSchemes.id, schemeId));

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "delete_marking_scheme",
      entityType: "marking_scheme",
      entityId: schemeId,
      details: { name: scheme.name },
    });

    revalidatePath("/dashboard/schemes");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete marking scheme" };
  }
}

export async function toggleSchemeStatus(schemeId: number) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const scheme = await db.query.markingSchemes.findFirst({
      where: eq(markingSchemes.id, schemeId),
    });

    if (!scheme) {
      return { success: false, error: "Marking scheme not found" };
    }

    await db
      .update(markingSchemes)
      .set({ isActive: !scheme.isActive })
      .where(eq(markingSchemes.id, schemeId));

    revalidatePath("/dashboard/schemes");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update scheme status" };
  }
}

export async function getMarkingScheme(schemeId: number) {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const scheme = await db.query.markingSchemes.findFirst({
    where: eq(markingSchemes.id, schemeId),
    with: {
      unit: true,
    },
  });

  return scheme;
}
