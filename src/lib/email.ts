import nodemailer from "nodemailer";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Email configuration - can be configured via environment variables
const emailConfig = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASSWORD || "",
  },
};

// Create transporter
const createTransporter = () => {
  // If no email credentials, return null (emails will be logged instead)
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.log("Email credentials not configured. Emails will be logged to console.");
    return null;
  }
  
  return nodemailer.createTransport(emailConfig);
};

// Email templates
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const emailTemplates = {
  upload_confirmation: (data: { traineeName: string; unitName: string; fileName: string }): EmailTemplate => ({
    subject: "Submission Received - Engineering Training System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Submission Received</h2>
        <p>Dear ${data.traineeName},</p>
        <p>Your submission has been successfully received.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Unit:</strong> ${data.unitName}</p>
          <p><strong>File:</strong> ${data.fileName}</p>
        </div>
        <p>You will be notified when your submission has been marked.</p>
        <p>Best regards,<br>Engineering Training System</p>
      </div>
    `,
    text: `Dear ${data.traineeName},\n\nYour submission has been successfully received.\n\nUnit: ${data.unitName}\nFile: ${data.fileName}\n\nYou will be notified when your submission has been marked.\n\nBest regards,\nEngineering Training System`,
  }),

  marking_complete: (data: { traineeName: string; unitName: string; score: number; maxScore: number; percentage: number; isCompetent: boolean }): EmailTemplate => ({
    subject: "Marking Complete - Engineering Training System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Marking Complete</h2>
        <p>Dear ${data.traineeName},</p>
        <p>Your submission has been marked.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Unit:</strong> ${data.unitName}</p>
          <p><strong>Score:</strong> ${data.score}/${data.maxScore} (${data.percentage}%)</p>
          <p><strong>Status:</strong> <span style="color: ${data.isCompetent ? '#16a34a' : '#dc2626'};">${data.isCompetent ? 'Competent' : 'Not Yet Competent'}</span></p>
        </div>
        <p>Please log in to view detailed feedback.</p>
        <p>Best regards,<br>Engineering Training System</p>
      </div>
    `,
    text: `Dear ${data.traineeName},\n\nYour submission has been marked.\n\nUnit: ${data.unitName}\nScore: ${data.score}/${data.maxScore} (${data.percentage}%)\nStatus: ${data.isCompetent ? 'Competent' : 'Not Yet Competent'}\n\nPlease log in to view detailed feedback.\n\nBest regards,\nEngineering Training System`,
  }),

  new_submission: (data: { trainerName: string; traineeName: string; unitName: string; fileName: string }): EmailTemplate => ({
    subject: "New Submission for Marking - Engineering Training System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Submission</h2>
        <p>Dear ${data.trainerName},</p>
        <p>A new submission has been uploaded for marking.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Trainee:</strong> ${data.traineeName}</p>
          <p><strong>Unit:</strong> ${data.unitName}</p>
          <p><strong>File:</strong> ${data.fileName}</p>
        </div>
        <p>Please log in to review and mark the submission.</p>
        <p>Best regards,<br>Engineering Training System</p>
      </div>
    `,
    text: `Dear ${data.trainerName},\n\nA new submission has been uploaded for marking.\n\nTrainee: ${data.traineeName}\nUnit: ${data.unitName}\nFile: ${data.fileName}\n\nPlease log in to review and mark the submission.\n\nBest regards,\nEngineering Training System`,
  }),

  points_earned: (data: { userName: string; points: number; reason: string; newBalance: number }): EmailTemplate => ({
    subject: "Points Earned - Engineering Training System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Points Earned!</h2>
        <p>Dear ${data.userName},</p>
        <p>Congratulations! You have earned points.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Points Earned:</strong> +${data.points}</p>
          <p><strong>Reason:</strong> ${data.reason}</p>
          <p><strong>New Balance:</strong> ${data.newBalance} points</p>
        </div>
        <p>Log in to redeem your points for rewards!</p>
        <p>Best regards,<br>Engineering Training System</p>
      </div>
    `,
    text: `Dear ${data.userName},\n\nCongratulations! You have earned points.\n\nPoints Earned: +${data.points}\nReason: ${data.reason}\nNew Balance: ${data.newBalance} points\n\nLog in to redeem your points for rewards!\n\nBest regards,\nEngineering Training System`,
  }),

  redemption_status: (data: { userName: string; rewardName: string; status: string; pointsSpent: number }): EmailTemplate => ({
    subject: "Redemption Update - Engineering Training System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Redemption Update</h2>
        <p>Dear ${data.userName},</p>
        <p>Your redemption request has been updated.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Reward:</strong> ${data.rewardName}</p>
          <p><strong>Points Spent:</strong> ${data.pointsSpent}</p>
          <p><strong>Status:</strong> <span style="text-transform: capitalize;">${data.status}</span></p>
        </div>
        <p>Best regards,<br>Engineering Training System</p>
      </div>
    `,
    text: `Dear ${data.userName},\n\nYour redemption request has been updated.\n\nReward: ${data.rewardName}\nPoints Spent: ${data.pointsSpent}\nStatus: ${data.status}\n\nBest regards,\nEngineering Training System`,
  }),

  welcome: (data: { userName: string; referralCode?: string }): EmailTemplate => ({
    subject: "Welcome to Engineering Training System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome!</h2>
        <p>Dear ${data.userName},</p>
        <p>Welcome to the Engineering Training System! Your account has been created successfully.</p>
        ${data.referralCode ? `
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Your Referral Code:</strong> ${data.referralCode}</p>
          <p>Share this code with friends to earn bonus points when they sign up!</p>
        </div>
        ` : ''}
        <p>You can now log in and start submitting your assignments.</p>
        <p>Best regards,<br>Engineering Training System</p>
      </div>
    `,
    text: `Dear ${data.userName},\n\nWelcome to the Engineering Training System! Your account has been created successfully.\n${data.referralCode ? `\nYour Referral Code: ${data.referralCode}\nShare this code with friends to earn bonus points when they sign up!\n` : ''}\nYou can now log in and start submitting your assignments.\n\nBest regards,\nEngineering Training System`,
  }),
};

// Send email function
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<boolean> {
  const transporter = createTransporter();
  
  if (!transporter) {
    // Log email to console instead of sending
    console.log("\n=== EMAIL (Not Sent - No Config) ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`Body: ${template.text}`);
    console.log("=====================================\n");
    return false;
  }
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@engineering-training.com",
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Create notification and send email
export async function createNotification(
  userId: number,
  type: string,
  title: string,
  message: string,
  relatedId?: number,
  templateData?: Record<string, unknown>
): Promise<void> {
  // Create notification in database
  await db.insert(notifications).values({
    userId,
    type,
    title,
    message,
    relatedId,
    isRead: false,
    emailSent: false,
  });
  
  // Get user email
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  
  if (!user) {
    console.error("User not found for notification:", userId);
    return;
  }
  
  // Send email if template exists and templateData provided
  if (templateData && type in emailTemplates) {
    const templateFn = emailTemplates[type as keyof typeof emailTemplates];
    if (templateFn) {
      const template = (templateFn as (data: Record<string, unknown>) => EmailTemplate)(templateData);
      const emailSent = await sendEmail(user.email, template);
      
      // Update notification with email status
      if (emailSent) {
        await db.update(notifications)
          .set({ emailSent: true })
          .where(eq(notifications.userId, userId));
      }
    }
  }
}

// Get unread notifications for a user
export async function getUnreadNotifications(userId: number) {
  return db.query.notifications.findMany({
    where: (notifications, { eq, and }) => and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ),
    orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    limit: 10,
  });
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: number) {
  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: number) {
  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export { emailTemplates };
