CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer,
	`details` text,
	`ip_address` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trainee_id` integer NOT NULL,
	`unit_id` integer NOT NULL,
	`enrolled_at` integer,
	`enrolled_by` integer,
	FOREIGN KEY (`trainee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enrolled_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `marking_schemes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unit_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`version` text DEFAULT '1.0' NOT NULL,
	`total_marks` integer DEFAULT 100 NOT NULL,
	`scheme_data` text NOT NULL,
	`marking_mode` text DEFAULT 'trainer_points' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`related_id` integer,
	`is_read` integer DEFAULT false NOT NULL,
	`email_sent` integer DEFAULT false NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`submission_id` integer NOT NULL,
	`trainee_id` integer NOT NULL,
	`unit_id` integer NOT NULL,
	`total_marks` integer DEFAULT 0 NOT NULL,
	`max_marks` integer DEFAULT 100 NOT NULL,
	`percentage` integer DEFAULT 0 NOT NULL,
	`is_competent` integer DEFAULT false NOT NULL,
	`met_expectation` integer DEFAULT false NOT NULL,
	`question_results` text,
	`feedback` text,
	`marked_file_path` text,
	`marked_by` integer,
	`marked_at` integer,
	`overridden_by` integer,
	`overridden_at` integer,
	FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trainee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`marked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`overridden_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `results_submission_id_unique` ON `results` (`submission_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trainee_id` integer NOT NULL,
	`unit_id` integer NOT NULL,
	`marking_scheme_id` integer,
	`file_name` text NOT NULL,
	`original_file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`status` text DEFAULT 'uploaded' NOT NULL,
	`uploaded_at` integer,
	`marked_at` integer,
	`marked_by` integer,
	FOREIGN KEY (`trainee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`marking_scheme_id`) REFERENCES `marking_schemes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`marked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`department` text,
	`total_marks` integer DEFAULT 100 NOT NULL,
	`passing_marks` integer DEFAULT 50 NOT NULL,
	`marking_type` text DEFAULT 'engineering' NOT NULL,
	`trainer_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`trainer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `units_code_unique` ON `units` (`code`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'trainee' NOT NULL,
	`department` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);