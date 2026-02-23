"use server";

import { login as authLogin, logout as authLogout, getCurrentUser, hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { users, auditLogs, referralCodes, referrals, userPoints, pointsTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const SIGNUP_BONUS_POINTS = 50;
const REFERRAL_BONUS_POINTS = 100;

function generateReferralCode(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return base + random;
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const name = formData.get("name") as string;
  const department = formData.get("department") as string;
  const referralCode = formData.get("referralCode") as string;
  
  if (!email || !password || !name) {
    return { success: false, error: "Email, password, and name are required" };
  }
  
  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }
  
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }
  
  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    return { success: false, error: "An account with this email already exists" };
  }
  
  // Create the user
  const hashedPassword = await hashPassword(password);
  const [newUser] = await db.insert(users).values({
    email,
    passwordHash: hashedPassword,
    name,
    department: department || null,
    role: "trainee", // New users are trainees by default
  }).returning();
  
  // Create referral code for the new user
  const newReferralCode = generateReferralCode(name);
  await db.insert(referralCodes).values({
    code: newReferralCode,
    userId: newUser.id,
    isActive: true,
  });
  
  // Initialize user points with signup bonus
  await db.insert(userPoints).values({
    userId: newUser.id,
    balance: SIGNUP_BONUS_POINTS,
    totalEarned: SIGNUP_BONUS_POINTS,
    totalRedeemed: 0,
  });
  
  // Log the signup bonus
  await db.insert(pointsTransactions).values({
    userId: newUser.id,
    amount: SIGNUP_BONUS_POINTS,
    type: "signup_bonus",
    description: "Welcome bonus for signing up",
  });
  
  // Handle referral code if provided
  if (referralCode && referralCode.trim() !== "") {
    const referrerCode = await db.select()
      .from(referralCodes)
      .where(eq(referralCodes.code, referralCode.trim()))
      .limit(1);
    
    if (referrerCode.length > 0 && referrerCode[0].isActive) {
      const referrerId = referrerCode[0].userId;
      
      // Don't allow self-referral
      if (referrerId !== newUser.id) {
        // Create referral record
        await db.insert(referrals).values({
          referrerId,
          referredUserId: newUser.id,
          referralCodeId: referrerCode[0].id,
          bonusPoints: REFERRAL_BONUS_POINTS,
          status: "completed",
        });
        
        // Award points to referrer
        const referrerPoints = await db.select()
          .from(userPoints)
          .where(eq(userPoints.userId, referrerId))
          .limit(1);
        
        if (referrerPoints.length > 0) {
          await db.update(userPoints)
            .set({
              balance: referrerPoints[0].balance + REFERRAL_BONUS_POINTS,
              totalEarned: referrerPoints[0].totalEarned + REFERRAL_BONUS_POINTS,
              updatedAt: new Date(),
            })
            .where(eq(userPoints.userId, referrerId));
        } else {
          // Create points record if doesn't exist
          await db.insert(userPoints).values({
            userId: referrerId,
            balance: REFERRAL_BONUS_POINTS,
            totalEarned: REFERRAL_BONUS_POINTS,
            totalRedeemed: 0,
          });
        }
        
        // Log referrer bonus
        await db.insert(pointsTransactions).values({
          userId: referrerId,
          amount: REFERRAL_BONUS_POINTS,
          type: "referral_bonus",
          description: `Referral bonus for inviting ${name}`,
          relatedId: newUser.id,
        });
        
        // Award bonus points to new user for using referral
        const newUserPoints = await db.select()
          .from(userPoints)
          .where(eq(userPoints.userId, newUser.id))
          .limit(1);
        
        if (newUserPoints.length > 0) {
          await db.update(userPoints)
            .set({
              balance: newUserPoints[0].balance + REFERRAL_BONUS_POINTS,
              totalEarned: newUserPoints[0].totalEarned + REFERRAL_BONUS_POINTS,
            })
            .where(eq(userPoints.userId, newUser.id));
          
          // Log referral bonus for new user
          await db.insert(pointsTransactions).values({
            userId: newUser.id,
            amount: REFERRAL_BONUS_POINTS,
            type: "referral_bonus",
            description: "Bonus for using a referral code",
            relatedId: referrerCode[0].id,
          });
        }
      }
    }
  }
  
  // Log the signup
  await db.insert(auditLogs).values({
    userId: newUser.id,
    action: "signup",
    entityType: "user",
    entityId: newUser.id,
  });
  
  // Auto-login the new user
  const result = await authLogin(email, password);
  return result;
}

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

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }
  
  const name = formData.get("name") as string;
  const department = formData.get("department") as string;
  
  if (!name || name.trim().length < 2) {
    return { success: false, error: "Name must be at least 2 characters" };
  }
  
  await db.update(users)
    .set({ 
      name: name.trim(),
      department: department?.trim() || null,
    })
    .where(eq(users.id, user.id));
  
  // Log the profile update
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "profile_update",
    entityType: "user",
    entityId: user.id,
  });
  
  revalidatePath("/dashboard");
  return { success: true, user: { ...user, name: name.trim(), department: department?.trim() || null } };
}
