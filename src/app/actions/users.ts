"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth";

export async function createUser(formData: FormData) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const department = formData.get("department") as string;

  if (!email || !password || !name || !role) {
    return { success: false, error: "Email, password, name, and role are required" };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  try {
    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        role: role as any,
        department: department || null,
      })
      .returning();

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "create_user",
      entityType: "user",
      entityId: newUser.id,
      details: { email, name, role },
    });

    revalidatePath("/dashboard/users");
    return { success: true, userId: newUser.id };
  } catch (error) {
    console.error("Create user error:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(formData: FormData) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const userId = parseInt(formData.get("userId") as string);
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const department = formData.get("department") as string;
  const password = formData.get("password") as string;

  if (!userId || !email || !name || !role) {
    return { success: false, error: "User ID, email, name, and role are required" };
  }

  try {
    // Check if email already exists for another user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser && existingUser.id !== userId) {
      return { success: false, error: "Email already exists" };
    }

    const updateData: any = {
      email,
      name,
      role: role as any,
      department: department || null,
    };

    if (password && password.length >= 8) {
      updateData.passwordHash = await hashPassword(password);
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "update_user",
      entityType: "user",
      entityId: userId,
      details: { email, name, role },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update user" };
  }
}

export async function toggleUserStatus(userId: number) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Prevent deactivating yourself
    if (targetUser.id === user.id) {
      return { success: false, error: "Cannot deactivate your own account" };
    }

    await db
      .update(users)
      .set({ isActive: !targetUser.isActive })
      .where(eq(users.id, userId));

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: targetUser.isActive ? "deactivate_user" : "activate_user",
      entityType: "user",
      entityId: userId,
      details: { email: targetUser.email },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update user status" };
  }
}

export async function deleteUser(userId: number) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Prevent deleting yourself
    if (targetUser.id === user.id) {
      return { success: false, error: "Cannot delete your own account" };
    }

    await db.delete(users).where(eq(users.id, userId));

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "delete_user",
      entityType: "user",
      entityId: userId,
      details: { email: targetUser.email, name: targetUser.name },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete user" };
  }
}

export async function getUser(userId: number) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    return null;
  }

  return db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}
