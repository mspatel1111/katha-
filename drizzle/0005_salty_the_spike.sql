CREATE TABLE `coupons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`kind` text DEFAULT 'percentage' NOT NULL,
	`value` integer NOT NULL,
	`minimum_amount` integer DEFAULT 0 NOT NULL,
	`maximum_discount` integer,
	`start_at` text,
	`end_at` text,
	`usage_limit` integer,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`product_ids` text DEFAULT '[]' NOT NULL,
	`categories` text DEFAULT '[]' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "coupon_usage_nonnegative" CHECK("coupons"."usage_count" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_coupons_code` ON `coupons` (`code`);--> statement-breakpoint
CREATE TABLE `inventory_changes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`order_id` text,
	`size` text NOT NULL,
	`delta` integer NOT NULL,
	`reason` text NOT NULL,
	`actor` text DEFAULT 'system' NOT NULL,
	`created_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_inventory_product_date` ON `inventory_changes` (`product_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_inventory_order` ON `inventory_changes` (`order_id`);--> statement-breakpoint
CREATE TABLE `operation_guards` (
	`token` text PRIMARY KEY NOT NULL,
	`passed` integer NOT NULL,
	CONSTRAINT "operation_guard_passed" CHECK("operation_guards"."passed" = 1)
);
--> statement-breakpoint
CREATE TABLE `order_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`status` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_order_events_order` ON `order_events` (`order_id`,`id`);--> statement-breakpoint
ALTER TABLE `orders` ADD `subtotal` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `discount_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `coupon_id` integer REFERENCES coupons(id);--> statement-breakpoint
ALTER TABLE `orders` ADD `coupon_code` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `coupon_revision` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `landmark` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `admin_notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancellation_reason` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `courier_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `tracking_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipped_at` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `delivered_at` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `inventory_released` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `revision` integer DEFAULT 0 NOT NULL;