ALTER TABLE `orders` ADD `request_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_id_unique` ON `orders` (`request_id`);--> statement-breakpoint
CREATE INDEX `idx_order_items_order_id` ON `order_items` (`order_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_product_overrides` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`old_price` integer,
	`image` text NOT NULL,
	`label` text,
	`active` integer DEFAULT 1 NOT NULL,
	`stock_s` integer DEFAULT 0 NOT NULL,
	`stock_m` integer DEFAULT 0 NOT NULL,
	`stock_l` integer DEFAULT 0 NOT NULL,
	`stock_xl` integer DEFAULT 0 NOT NULL,
	`stock_xxl` integer DEFAULT 0 NOT NULL,
	`stock_xxxl` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	CONSTRAINT "product_overrides_stock_nonnegative" CHECK("__new_product_overrides"."stock_s" >= 0 AND "__new_product_overrides"."stock_m" >= 0 AND "__new_product_overrides"."stock_l" >= 0 AND "__new_product_overrides"."stock_xl" >= 0 AND "__new_product_overrides"."stock_xxl" >= 0 AND "__new_product_overrides"."stock_xxxl" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_product_overrides`("id", "name", "price", "old_price", "image", "label", "active", "stock_s", "stock_m", "stock_l", "stock_xl", "stock_xxl", "stock_xxxl", "updated_at") SELECT "id", "name", "price", "old_price", "image", "label", "active", "stock_s", "stock_m", "stock_l", "stock_xl", "stock_xxl", "stock_xxxl", "updated_at" FROM `product_overrides`;--> statement-breakpoint
DROP TABLE `product_overrides`;--> statement-breakpoint
ALTER TABLE `__new_product_overrides` RENAME TO `product_overrides`;--> statement-breakpoint
PRAGMA foreign_keys=ON;