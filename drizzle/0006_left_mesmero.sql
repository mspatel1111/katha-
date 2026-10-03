CREATE INDEX `idx_orders_status_created_at` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_phone_last10` ON `orders` (`phone_last10`);