CREATE TABLE `request_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text,
	`app_name` text,
	`key_id` text,
	`key_name` text,
	`action` text NOT NULL,
	`method` text NOT NULL,
	`path` text,
	`status` integer NOT NULL,
	`error` text,
	`size` integer,
	`duration_ms` integer NOT NULL,
	`ip` text,
	`user_agent` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `request_logs_created_at_idx` ON `request_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `request_logs_app_idx` ON `request_logs` (`app_id`,`created_at`);