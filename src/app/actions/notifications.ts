"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

// Get all notifications for the current user
export async function getNotifications(limit: number = 20) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, user.id),
      orderBy: [desc(notifications.createdAt)],
      limit,
    });

    return { notifications: userNotifications };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { error: "Failed to fetch notifications" };
  }
}

// Get unread notification count
export async function getUnreadCount() {
  const user = await getCurrentUser();
  if (!user) {
    return { count: 0 };
  }

  try {
    const unreadNotifications = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, user.id),
        eq(notifications.isRead, false)
      ),
    });

    return { count: unreadNotifications.length };
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return { count: 0 };
  }
}

// Mark a notification as read
export async function markAsRead(notificationId: number) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, user.id)
      ));

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { error: "Failed to mark notification as read" };
  }
}

// Mark all notifications as read
export async function markAllAsRead() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, user.id));

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { error: "Failed to mark all notifications as read" };
  }
}

// Delete a notification
export async function deleteNotification(notificationId: number) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    await db.delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, user.id)
      ));

    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { error: "Failed to delete notification" };
  }
}

// Clear all notifications
export async function clearAllNotifications() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    await db.delete(notifications)
      .where(eq(notifications.userId, user.id));

    return { success: true };
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return { error: "Failed to clear notifications" };
  }
}
