"use server";

import { login as authLogin, logout as authLogout, getCurrentUser, hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }
  
  const result = await authLogin(email, password);
  
  if (result.success) {
    // Log the login
    await db.insert(auditLogs).values({
      userId: result.user!.id,
      action: "login",
      entityType: "user",
      entityId: result.user!.id,
    });
  }
  
  return result;
}

export async function logout() {
  await authLogout();
  revalidatePath("/");
  redirect("/");
}

export async function getAuthUser() {
  return getCurrentUser();
}

export async function changePassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }
  
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "All fields are required" };
  }
  
  if (newPassword !== confirmPassword) {
    return { success: false, error: "New passwords do not match" };
  }
  
  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }
  
  // Verify current password
  const userRecord = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!userRecord.length) {
    return { success: false, error: "User not found" };
  }
  
  const { verifyPassword } = await import("@/lib/auth");
  const isValid = await verifyPassword(currentPassword, userRecord[0].passwordHash);
  if (!isValid) {
    return { success: false, error: "Current password is incorrect" };
  }
  
  // Update password
  const hashedPassword = await hashPassword(newPassword);
  await db.update(users)
    .set({ passwordHash: hashedPassword })
    .where(eq(users.id, user.id));
  
  // Log the password change
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "password_change",
    entityType: "user",
    entityId: user.id,
  });
  
  return { success: true };
}
