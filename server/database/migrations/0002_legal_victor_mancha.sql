CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text,
	`password_hash` text NOT NULL,
	`disabled_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
ALTER TABLE `apps` ADD `user_id` text;--> statement-breakpoint
CREATE INDEX `apps_user_idx` ON `apps` (`user_id`);--> statement-breakpoint
ALTER TABLE `request_logs` ADD `user_id` text;--> statement-breakpoint
CREATE INDEX `request_logs_user_idx` ON `request_logs` (`user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `s3_credentials` ADD `user_id` text;--> statement-breakpoint
CREATE INDEX `s3_credentials_user_idx` ON `s3_credentials` (`user_id`);