CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`size` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt` text NOT NULL,
	`customer_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`pincode` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`payment_method` text NOT NULL,
	`gateway_order_id` text,
	`gateway_payment_id` text,
	`created_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_receipt_unique` ON `orders` (`receipt`);--> statement-breakpoint
CREATE TABLE `product_overrides` (
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
	`updated_at` text DEFAULT '' NOT NULL
);
