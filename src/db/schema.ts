import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// User roles enum
export type UserRole = "trainee" | "trainer" | "admin";

// Submission status enum
export type SubmissionStatus = "uploaded" | "waiting" | "marking" | "marked" | "available";

// Users table - supports trainees, trainers, and admins
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["trainee", "trainer", "admin"] }).notNull().default("trainee"),
  department: text("department"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Units/Subjects table
export const units = sqliteTable("units", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  department: text("department"),
  totalMarks: integer("total_marks").notNull().default(100),
  passingMarks: integer("passing_marks").notNull().default(50),
  markingType: text("marking_type", { enum: ["engineering", "theoretical", "mixed"] }).notNull().default("engineering"),
  trainerId: integer("trainer_id").references(() => users.id),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Marking schemes table
export const markingSchemes = sqliteTable("marking_schemes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  unitId: integer("unit_id").notNull().references(() => units.id),
  name: text("name").notNull(),
  description: text("description"),
  version: text("version").notNull().default("1.0"),
  totalMarks: integer("total_marks").notNull().default(100),
  schemeData: text("scheme_data", { mode: "json" }).notNull(), // JSON structure for questions
  markingMode: text("marking_mode", { enum: ["ai_reference", "trainer_upload", "trainer_points"] }).notNull().default("trainer_points"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Submissions table - uploaded assignments
export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  traineeId: integer("trainee_id").notNull().references(() => users.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  markingSchemeId: integer("marking_scheme_id").references(() => markingSchemes.id),
  fileName: text("file_name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // doc, docx, ppt, pptx, pdf
  fileSize: integer("file_size").notNull(),
  status: text("status", { enum: ["uploaded", "waiting", "marking", "marked", "available"] }).notNull().default("uploaded"),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  markedAt: integer("marked_at", { mode: "timestamp" }),
  markedBy: integer("marked_by").references(() => users.id), // AI or trainer who marked
});

// Results table - marked submissions with scores
export const results = sqliteTable("results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  submissionId: integer("submission_id").notNull().references(() => submissions.id).unique(),
  traineeId: integer("trainee_id").notNull().references(() => users.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  totalMarks: integer("total_marks").notNull().default(0),
  maxMarks: integer("max_marks").notNull().default(100),
  percentage: integer("percentage").notNull().default(0),
  isCompetent: integer("is_competent", { mode: "boolean" }).notNull().default(false),
  metExpectation: integer("met_expectation", { mode: "boolean" }).notNull().default(false),
  questionResults: text("question_results", { mode: "json" }), // JSON with per-question marks
  feedback: text("feedback"),
  markedFilePath: text("marked_file_path"), // Path to marked document
  markedBy: integer("marked_by").references(() => users.id),
  markedAt: integer("marked_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  overriddenBy: integer("overridden_by").references(() => users.id), // If trainer overrode marks
  overriddenAt: integer("overridden_at", { mode: "timestamp" }),
});

// Notifications table
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // upload_confirmation, marking_complete, new_submission, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // Related submission/result ID
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  emailSent: integer("email_sent", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Audit logs table
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // user, submission, result, etc.
  entityId: integer("entity_id"),
  details: text("details", { mode: "json" }),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Sessions table for authentication
export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Trainee-Unit enrollment (which trainees are enrolled in which units)
export const enrollments = sqliteTable("enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  traineeId: integer("trainee_id").notNull().references(() => users.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  enrolledAt: integer("enrolled_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  enrolledBy: integer("enrolled_by").references(() => users.id),
});

// Referral codes table - each user can have a unique referral code
export const referralCodes = sqliteTable("referral_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Referrals table - tracks when someone uses a referral code
export const referrals = sqliteTable("referrals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  referrerId: integer("referrer_id").notNull().references(() => users.id), // User who owns the referral code
  referredUserId: integer("referred_user_id").notNull().references(() => users.id), // New user who signed up
  referralCodeId: integer("referral_code_id").notNull().references(() => referralCodes.id),
  bonusPoints: integer("bonus_points").notNull().default(100), // Points awarded for successful referral
  status: text("status", { enum: ["pending", "completed", "cancelled"] }).notNull().default("completed"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// User points table - tracks points balance for each user
export const userPoints = sqliteTable("user_points", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  balance: integer("balance").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  totalRedeemed: integer("total_redeemed").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Points transactions table - tracks all point movements
export const pointsTransactions = sqliteTable("points_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // Positive for earning, negative for redemption
  type: text("type", { enum: ["referral_bonus", "signup_bonus", "redemption", "admin_adjustment", "task_completion"] }).notNull(),
  description: text("description").notNull(),
  relatedId: integer("related_id"), // Related referral, redemption, etc.
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Redemption options table - available rewards to redeem
export const redemptionOptions = sqliteTable("redemption_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["gift_card", "voucher", "airtime", "data_bundle", "premium_feature"] }).notNull(),
  pointsCost: integer("points_cost").notNull(),
  value: text("value"), // Monetary value or feature identifier
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Redemptions table - tracks redemption requests
export const redemptions = sqliteTable("redemptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  optionId: integer("option_id").notNull().references(() => redemptionOptions.id),
  pointsSpent: integer("points_spent").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "fulfilled"] }).notNull().default("pending"),
  requestedAt: integer("requested_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  fulfilledAt: integer("fulfilled_at", { mode: "timestamp" }),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  submissions: many(submissions),
  results: many(results),
  notifications: many(notifications),
  sessions: many(sessions),
  enrollments: many(enrollments),
  referralCode: one(referralCodes, {
    fields: [users.id],
    references: [referralCodes.userId],
  }),
  referrals: many(referrals),
  points: one(userPoints, {
    fields: [users.id],
    references: [userPoints.userId],
  }),
  pointsTransactions: many(pointsTransactions),
  redemptions: many(redemptions),
}));

export const unitsRelations = relations(units, ({ many, one }) => ({
  submissions: many(submissions),
  markingSchemes: many(markingSchemes),
  results: many(results),
  enrollments: many(enrollments),
  trainer: one(users, {
    fields: [units.trainerId],
    references: [users.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  trainee: one(users, {
    fields: [submissions.traineeId],
    references: [users.id],
  }),
  unit: one(units, {
    fields: [submissions.unitId],
    references: [units.id],
  }),
  markingScheme: one(markingSchemes, {
    fields: [submissions.markingSchemeId],
    references: [markingSchemes.id],
  }),
  result: one(results, {
    fields: [submissions.id],
    references: [results.submissionId],
  }),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  submission: one(submissions, {
    fields: [results.submissionId],
    references: [submissions.id],
  }),
  trainee: one(users, {
    fields: [results.traineeId],
    references: [users.id],
  }),
  unit: one(units, {
    fields: [results.unitId],
    references: [units.id],
  }),
}));

export const markingSchemesRelations = relations(markingSchemes, ({ one }) => ({
  unit: one(units, {
    fields: [markingSchemes.unitId],
    references: [units.id],
  }),
  creator: one(users, {
    fields: [markingSchemes.createdBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  trainee: one(users, {
    fields: [enrollments.traineeId],
    references: [users.id],
  }),
  unit: one(units, {
    fields: [enrollments.unitId],
    references: [units.id],
  }),
  enroller: one(users, {
    fields: [enrollments.enrolledBy],
    references: [users.id],
  }),
}));

// Referral relations
export const referralCodesRelations = relations(referralCodes, ({ one, many }) => ({
  user: one(users, {
    fields: [referralCodes.userId],
    references: [users.id],
  }),
  referrals: many(referrals),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
  }),
  referredUser: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
  }),
  referralCode: one(referralCodes, {
    fields: [referrals.referralCodeId],
    references: [referralCodes.id],
  }),
}));

export const userPointsRelations = relations(userPoints, ({ one, many }) => ({
  user: one(users, {
    fields: [userPoints.userId],
    references: [users.id],
  }),
  transactions: many(pointsTransactions),
}));

export const pointsTransactionsRelations = relations(pointsTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointsTransactions.userId],
    references: [users.id],
  }),
}));

export const redemptionOptionsRelations = relations(redemptionOptions, ({ many }) => ({
  redemptions: many(redemptions),
}));

export const redemptionsRelations = relations(redemptions, ({ one }) => ({
  user: one(users, {
    fields: [redemptions.userId],
    references: [users.id],
  }),
  option: one(redemptionOptions, {
    fields: [redemptions.optionId],
    references: [redemptionOptions.id],
  }),
  reviewer: one(users, {
    fields: [redemptions.reviewedBy],
    references: [users.id],
  }),
}));

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;
export type MarkingScheme = typeof markingSchemes.$inferSelect;
export type NewMarkingScheme = typeof markingSchemes.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type Result = typeof results.$inferSelect;
export type NewResult = typeof results.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type NewReferralCode = typeof referralCodes.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type UserPoints = typeof userPoints.$inferSelect;
export type NewUserPoints = typeof userPoints.$inferInsert;
export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type NewPointsTransaction = typeof pointsTransactions.$inferInsert;
export type RedemptionOption = typeof redemptionOptions.$inferSelect;
export type NewRedemptionOption = typeof redemptionOptions.$inferInsert;
export type Redemption = typeof redemptions.$inferSelect;
export type NewRedemption = typeof redemptions.$inferInsert;
