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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  submissions: many(submissions),
  results: many(results),
  notifications: many(notifications),
  sessions: many(sessions),
  enrollments: many(enrollments),
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
