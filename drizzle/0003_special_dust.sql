CREATE TABLE `admin_audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`target` text,
	`created_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_admin_audit_created_at` ON `admin_audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `checkout_rate_limits` (
	`rate_key` text NOT NULL,
	`window_start` integer NOT NULL,
	`request_count` integer DEFAULT 1 NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`rate_key`, `window_start`),
	CONSTRAINT "checkout_rate_limits_positive" CHECK("checkout_rate_limits"."request_count" > 0)
);
--> statement-breakpoint
CREATE INDEX `idx_checkout_rate_limits_window` ON `checkout_rate_limits` (`window_start`);--> statement-breakpoint
CREATE TABLE `payment_events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_sha256` text NOT NULL,
	`received_at` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payment_events_order_id` ON `payment_events` (`order_id`);--> statement-breakpoint
ALTER TABLE `orders` ADD `phone_last10` text;--> statement-breakpoint
UPDATE `orders`
SET `phone_last10` = substr(replace(replace(replace(replace(replace(`phone`, ' ', ''), '-', ''), '+', ''), '(', ''), ')', ''), -10)
WHERE `phone_last10` IS NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `gateway_session_id` text;--> statement-breakpoint
CREATE INDEX `idx_orders_gateway_order_id` ON `orders` (`gateway_order_id`);--> statement-breakpoint
CREATE INDEX `idx_orders_payment_created_at` ON `orders` (`payment_status`,`created_at`);
