"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { userPoints, pointsTransactions, redemptionOptions, redemptions, referralCodes, referrals, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Get user's points balance
export async function getUserPoints() {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const points = await db.select()
    .from(userPoints)
    .where(eq(userPoints.userId, user.id))
    .limit(1);
  
  return points[0] || null;
}

// Get user's referral code
export async function getUserReferralCode() {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const code = await db.select()
    .from(referralCodes)
    .where(eq(referralCodes.userId, user.id))
    .limit(1);
  
  return code[0] || null;
}

// Get user's referral history
export async function getReferralHistory() {
  const user = await getCurrentUser();
  if (!user) return [];
  
  const referralsList = await db.select({
    referral: referrals,
    referredUser: users,
  })
    .from(referrals)
    .leftJoin(users, eq(referrals.referredUserId, users.id))
    .where(eq(referrals.referrerId, user.id))
    .orderBy(desc(referrals.createdAt));
  
  return referralsList;
}

// Get user's points transactions
export async function getPointsTransactions() {
  const user = await getCurrentUser();
  if (!user) return [];
  
  const transactions = await db.select()
    .from(pointsTransactions)
    .where(eq(pointsTransactions.userId, user.id))
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(50);
  
  return transactions;
}

// Get available redemption options
export async function getRedemptionOptions() {
  const options = await db.select()
    .from(redemptionOptions)
    .where(eq(redemptionOptions.isActive, true))
    .orderBy(redemptionOptions.pointsCost);
  
  return options;
}

// Request a redemption
export async function requestRedemption(optionId: number) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }
  
  // Get user's points
  const userPointsRecord = await db.select()
    .from(userPoints)
    .where(eq(userPoints.userId, user.id))
    .limit(1);
  
  if (!userPointsRecord.length) {
    return { success: false, error: "Points record not found" };
  }
  
  // Get redemption option
  const option = await db.select()
    .from(redemptionOptions)
    .where(eq(redemptionOptions.id, optionId))
    .limit(1);
  
  if (!option.length || !option[0].isActive) {
    return { success: false, error: "Invalid redemption option" };
  }
  
  // Check if user has enough points
  if (userPointsRecord[0].balance < option[0].pointsCost) {
    return { success: false, error: "Insufficient points" };
  }
  
  // Deduct points
  await db.update(userPoints)
    .set({
      balance: userPointsRecord[0].balance - option[0].pointsCost,
      totalRedeemed: userPointsRecord[0].totalRedeemed + option[0].pointsCost,
      updatedAt: new Date(),
    })
    .where(eq(userPoints.userId, user.id));
  
  // Create redemption request
  const [redemption] = await db.insert(redemptions).values({
    userId: user.id,
    optionId: option[0].id,
    pointsSpent: option[0].pointsCost,
    status: "pending",
  }).returning();
  
  // Log the transaction
  await db.insert(pointsTransactions).values({
    userId: user.id,
    amount: -option[0].pointsCost,
    type: "redemption",
    description: `Redemption request: ${option[0].name}`,
    relatedId: redemption.id,
  });
  
  revalidatePath("/dashboard/rewards");
  return { success: true, redemption };
}

// Get user's redemption history
export async function getUserRedemptions() {
  const user = await getCurrentUser();
  if (!user) return [];
  
  const userRedemptions = await db.select({
    redemption: redemptions,
    option: redemptionOptions,
  })
    .from(redemptions)
    .leftJoin(redemptionOptions, eq(redemptions.optionId, redemptionOptions.id))
    .where(eq(redemptions.userId, user.id))
    .orderBy(desc(redemptions.requestedAt));
  
  return userRedemptions;
}

// Admin: Get all pending redemptions
export async function getPendingRedemptions() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return [];
  }
  
  const pendingRedemptions = await db.select({
    redemption: redemptions,
    user: users,
    option: redemptionOptions,
  })
    .from(redemptions)
    .leftJoin(users, eq(redemptions.userId, users.id))
    .leftJoin(redemptionOptions, eq(redemptions.optionId, redemptionOptions.id))
    .where(eq(redemptions.status, "pending"))
    .orderBy(redemptions.requestedAt);
  
  return pendingRedemptions;
}

// Admin: Get all redemptions
export async function getAllRedemptions() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return [];
  }
  
  const allRedemptions = await db.select({
    redemption: redemptions,
    user: users,
    option: redemptionOptions,
  })
    .from(redemptions)
    .leftJoin(users, eq(redemptions.userId, users.id))
    .leftJoin(redemptionOptions, eq(redemptions.optionId, redemptionOptions.id))
    .orderBy(desc(redemptions.requestedAt));
  
  return allRedemptions;
}

// Admin: Approve redemption
export async function approveRedemption(redemptionId: number, notes?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }
  
  const redemption = await db.select()
    .from(redemptions)
    .where(eq(redemptions.id, redemptionId))
    .limit(1);
  
  if (!redemption.length) {
    return { success: false, error: "Redemption not found" };
  }
  
  await db.update(redemptions)
    .set({
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: user.id,
      reviewNotes: notes || null,
    })
    .where(eq(redemptions.id, redemptionId));
  
  revalidatePath("/dashboard/redemptions");
  return { success: true };
}

// Admin: Reject redemption (refund points)
export async function rejectRedemption(redemptionId: number, reason: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }
  
  const redemption = await db.select()
    .from(redemptions)
    .where(eq(redemptions.id, redemptionId))
    .limit(1);
  
  if (!redemption.length) {
    return { success: false, error: "Redemption not found" };
  }
  
  // Refund points
  const userPointsRecord = await db.select()
    .from(userPoints)
    .where(eq(userPoints.userId, redemption[0].userId))
    .limit(1);
  
  if (userPointsRecord.length) {
    await db.update(userPoints)
      .set({
        balance: userPointsRecord[0].balance + redemption[0].pointsSpent,
        totalRedeemed: userPointsRecord[0].totalRedeemed - redemption[0].pointsSpent,
        updatedAt: new Date(),
      })
      .where(eq(userPoints.userId, redemption[0].userId));
    
    // Log refund
    await db.insert(pointsTransactions).values({
      userId: redemption[0].userId,
      amount: redemption[0].pointsSpent,
      type: "admin_adjustment",
      description: `Refund for rejected redemption: ${reason}`,
      relatedId: redemptionId,
    });
  }
  
  // Update redemption status
  await db.update(redemptions)
    .set({
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: user.id,
      reviewNotes: reason,
    })
    .where(eq(redemptions.id, redemptionId));
  
  revalidatePath("/dashboard/redemptions");
  return { success: true };
}

// Admin: Mark redemption as fulfilled
export async function fulfillRedemption(redemptionId: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }
  
  await db.update(redemptions)
    .set({
      status: "fulfilled",
      fulfilledAt: new Date(),
    })
    .where(eq(redemptions.id, redemptionId));
  
  revalidatePath("/dashboard/redemptions");
  return { success: true };
}

// Admin: Add redemption option
export async function addRedemptionOption(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }
  
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as string;
  const pointsCost = parseInt(formData.get("pointsCost") as string);
  const value = formData.get("value") as string;
  
  if (!name || !type || !pointsCost) {
    return { success: false, error: "Name, type, and points cost are required" };
  }
  
  await db.insert(redemptionOptions).values({
    name,
    description: description || null,
    type: type as "gift_card" | "voucher" | "airtime" | "data_bundle" | "premium_feature",
    pointsCost,
    value: value || null,
    isActive: true,
  });
  
  revalidatePath("/dashboard/rewards");
  return { success: true };
}

// Admin: Toggle redemption option active status
export async function toggleRedemptionOption(optionId: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }
  
  const option = await db.select()
    .from(redemptionOptions)
    .where(eq(redemptionOptions.id, optionId))
    .limit(1);
  
  if (!option.length) {
    return { success: false, error: "Option not found" };
  }
  
  await db.update(redemptionOptions)
    .set({ isActive: !option[0].isActive })
    .where(eq(redemptionOptions.id, optionId));
  
  revalidatePath("/dashboard/rewards");
  return { success: true };
}
