CREATE TABLE `product_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`url` text NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_primary` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product_overrides`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_product_images_product_order` ON `product_images` (`product_id`,`display_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_product_images_primary` ON `product_images` (`product_id`) WHERE "product_images"."is_primary" = 1;--> statement-breakpoint
CREATE TABLE `store_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `sku` text;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `slug` text;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `category` text DEFAULT 'Kurtis' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `color` text DEFAULT 'Unspecified' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `fabric` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `work` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `wash_care` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `occasion` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `fit` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `length` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `dispatch_time` text DEFAULT '2–4 working days' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `featured` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `new_arrival` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `bestseller` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `display_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `low_stock_threshold` integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `archived` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `created_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_overrides` ADD `revision` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_sku` ON `product_overrides` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_slug` ON `product_overrides` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_products_active_order` ON `product_overrides` (`active`,`archived`,`display_order`);--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `product_overrides` (`category`,`active`);