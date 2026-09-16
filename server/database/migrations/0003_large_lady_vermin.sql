ALTER TABLE `apps` ADD `preview_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `apps` ADD `preview_ttl_minutes` integer DEFAULT 10 NOT NULL;