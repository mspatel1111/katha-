import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const productOverrides = sqliteTable("product_overrides", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  oldPrice: integer("old_price"),
  image: text("image").notNull(),
  label: text("label"),
  active: integer("active").notNull().default(1),
  stockS: integer("stock_s").notNull().default(0),
  stockM: integer("stock_m").notNull().default(0),
  stockL: integer("stock_l").notNull().default(0),
  stockXl: integer("stock_xl").notNull().default(0),
  stockXxl: integer("stock_xxl").notNull().default(0),
  stockXxxl: integer("stock_xxxl").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(""),
  sku: text("sku"),
  slug: text("slug"),
  category: text("category").notNull().default("Kurtis"),
  color: text("color").notNull().default("Unspecified"),
  fabric: text("fabric").notNull().default(""),
  description: text("description").notNull().default(""),
  work: text("work").notNull().default(""),
  washCare: text("wash_care").notNull().default(""),
  occasion: text("occasion").notNull().default(""),
  fit: text("fit").notNull().default(""),
  length: text("length").notNull().default(""),
  dispatchTime: text("dispatch_time").notNull().default("2–4 working days"),
  featured: integer("featured").notNull().default(0),
  newArrival: integer("new_arrival").notNull().default(0),
  bestseller: integer("bestseller").notNull().default(0),
  displayOrder: integer("display_order").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(3),
  archived: integer("archived").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
  revision: integer("revision").notNull().default(0),
}, (table) => [
  uniqueIndex("idx_products_sku").on(table.sku),
  uniqueIndex("idx_products_slug").on(table.slug),
  index("idx_products_active_order").on(table.active, table.archived, table.displayOrder),
  index("idx_products_category").on(table.category, table.active),
  check("product_overrides_stock_nonnegative", sql`${table.stockS} >= 0 AND ${table.stockM} >= 0 AND ${table.stockL} >= 0 AND ${table.stockXl} >= 0 AND ${table.stockXxl} >= 0 AND ${table.stockXxxl} >= 0`),
]);

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  receipt: text("receipt").notNull().unique(),
  requestId: text("request_id").unique(),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  phoneLast10: text("phone_last10"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull(),
  gatewayOrderId: text("gateway_order_id"),
  gatewaySessionId: text("gateway_session_id"),
  gatewayPaymentId: text("gateway_payment_id"),
  subtotal: integer("subtotal").notNull().default(0),
  shippingAmount: integer("shipping_amount").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  couponId: integer("coupon_id").references(() => coupons.id),
  couponCode: text("coupon_code"),
  couponRevision: integer("coupon_revision"),
  landmark: text("landmark").notNull().default(""),
  adminNotes: text("admin_notes").notNull().default(""),
  cancellationReason: text("cancellation_reason").notNull().default(""),
  courierName: text("courier_name").notNull().default(""),
  trackingNumber: text("tracking_number").notNull().default(""),
  shippedAt: text("shipped_at"),
  deliveredAt: text("delivered_at"),
  inventoryReleased: integer("inventory_released").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
}, (table) => [
  index("idx_orders_created_at").on(table.createdAt),
  index("idx_orders_gateway_order_id").on(table.gatewayOrderId),
  index("idx_orders_payment_created_at").on(table.paymentStatus, table.createdAt),
  index("idx_orders_status_created_at").on(table.status, table.createdAt),
  index("idx_orders_phone_last10").on(table.phoneLast10),
]);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
}, (table) => [
  index("idx_order_items_order_id").on(table.orderId),
]);

export const paymentEvents = sqliteTable("payment_events", {
  eventId: text("event_id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id),
  eventType: text("event_type").notNull(),
  payloadSha256: text("payload_sha256").notNull(),
  receivedAt: text("received_at").notNull().default(""),
}, (table) => [
  index("idx_payment_events_order_id").on(table.orderId),
]);

export const checkoutRateLimits = sqliteTable("checkout_rate_limits", {
  rateKey: text("rate_key").notNull(),
  windowStart: integer("window_start").notNull(),
  requestCount: integer("request_count").notNull().default(1),
  updatedAt: text("updated_at").notNull().default(""),

}, (table) => [
  primaryKey({ columns: [table.rateKey, table.windowStart] }),
  index("idx_checkout_rate_limits_window").on(table.windowStart),
  check("checkout_rate_limits_positive", sql`${table.requestCount} > 0`),
]);

export const productImages = sqliteTable("product_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => productOverrides.id),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  displayOrder: integer("display_order").notNull().default(0),
  primary: integer("is_primary").notNull().default(0),
}, table => [
  index("idx_product_images_product_order").on(table.productId, table.displayOrder),
  uniqueIndex("idx_product_images_primary").on(table.productId).where(sql`${table.primary} = 1`),
]);

export const storeSettings = sqliteTable("store_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  revision: integer("revision").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(""),
});

export const coupons = sqliteTable("coupons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  kind: text("kind").notNull().default("percentage"),
  value: integer("value").notNull(),
  minimumAmount: integer("minimum_amount").notNull().default(0),
  maximumDiscount: integer("maximum_discount"),
  startAt: text("start_at"),
  endAt: text("end_at"),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  active: integer("active").notNull().default(1),
  productIds: text("product_ids").notNull().default("[]"),
  categories: text("categories").notNull().default("[]"),
  revision: integer("revision").notNull().default(0),
}, table => [
  uniqueIndex("idx_coupons_code").on(table.code),
  check("coupon_usage_nonnegative", sql`${table.usageCount} >= 0`),
]);
export const inventoryChanges = sqliteTable("inventory_changes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  orderId: text("order_id"),
  size: text("size").notNull(),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  actor: text("actor").notNull().default("system"),
  createdAt: text("created_at").notNull().default(""),
},table=>[index("idx_inventory_product_date").on(table.productId,table.createdAt),index("idx_inventory_order").on(table.orderId)]);
export const orderEvents = sqliteTable("order_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull().references(() => orders.id),
  status: text("status").notNull(),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
},table=>[index("idx_order_events_order").on(table.orderId,table.id)]);
export const operationGuards = sqliteTable("operation_guards", {
  token: text("token").primaryKey(),
  passed: integer("passed").notNull(),
},table=>[check("operation_guard_passed", sql`${table.passed} = 1`)]);

export const adminAuditLog = sqliteTable("admin_audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  createdAt: text("created_at").notNull().default(""),
}, (table) => [
  index("idx_admin_audit_created_at").on(table.createdAt),
]);
