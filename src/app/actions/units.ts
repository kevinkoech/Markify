"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { units, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createUnit(formData: FormData) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const department = formData.get("department") as string;
  const totalMarks = parseInt(formData.get("totalMarks") as string) || 100;
  const passingMarks = parseInt(formData.get("passingMarks") as string) || 50;
  const markingType = formData.get("markingType") as string;
  const trainerId = formData.get("trainerId") as string;

  if (!code || !name) {
    return { success: false, error: "Code and name are required" };
  }

  try {
    const [unit] = await db
      .insert(units)
      .values({
        code,
        name,
        description: description || null,
        department: department || null,
        totalMarks,
        passingMarks,
        markingType: markingType as any,
        trainerId: trainerId ? parseInt(trainerId) : null,
      })
      .returning();

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "create_unit",
      entityType: "unit",
      entityId: unit.id,
      details: { code, name },
    });

    revalidatePath("/dashboard/units");
    return { success: true, unitId: unit.id };
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return { success: false, error: "Unit code already exists" };
    }
    return { success: false, error: "Failed to create unit" };
  }
}

export async function updateUnit(formData: FormData) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  const unitId = parseInt(formData.get("unitId") as string);
  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const department = formData.get("department") as string;
  const totalMarks = parseInt(formData.get("totalMarks") as string) || 100;
  const passingMarks = parseInt(formData.get("passingMarks") as string) || 50;
  const markingType = formData.get("markingType") as string;
  const trainerId = formData.get("trainerId") as string;

  if (!unitId || !code || !name) {
    return { success: false, error: "Unit ID, code, and name are required" };
  }

  try {
    await db
      .update(units)
      .set({
        code,
        name,
        description: description || null,
        department: department || null,
        totalMarks,
        passingMarks,
        markingType: markingType as any,
        trainerId: trainerId ? parseInt(trainerId) : null,
      })
      .where(eq(units.id, unitId));

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "update_unit",
      entityType: "unit",
      entityId: unitId,
      details: { code, name },
    });

    revalidatePath("/dashboard/units");
    return { success: true };
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return { success: false, error: "Unit code already exists" };
    }
    return { success: false, error: "Failed to update unit" };
  }
}

export async function deleteUnit(unitId: number) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    return { success: false, error: "Only admins can delete units" };
  }

  try {
    const unit = await db.query.units.findFirst({
      where: eq(units.id, unitId),
    });

    if (!unit) {
      return { success: false, error: "Unit not found" };
    }

    await db.delete(units).where(eq(units.id, unitId));

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "delete_unit",
      entityType: "unit",
      entityId: unitId,
      details: { code: unit.code, name: unit.name },
    });

    revalidatePath("/dashboard/units");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete unit" };
  }
}

export async function toggleUnitStatus(unitId: number) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const unit = await db.query.units.findFirst({
      where: eq(units.id, unitId),
    });

    if (!unit) {
      return { success: false, error: "Unit not found" };
    }

    await db
      .update(units)
      .set({ isActive: !unit.isActive })
      .where(eq(units.id, unitId));

    revalidatePath("/dashboard/units");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update unit status" };
  }
}
