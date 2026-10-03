-- Guards run in the same D1 batch transaction as the order and its items.
CREATE TRIGGER katha_reserve_stock BEFORE INSERT ON order_items
BEGIN
 SELECT CASE WHEN NEW.quantity < 1 OR NEW.quantity > 10 OR NEW.size NOT IN ('S','M','L','XL','XXL','XXXL') THEN RAISE(ABORT,'Invalid order item') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM order_items WHERE order_id=NEW.order_id AND product_id=NEW.product_id AND size=NEW.size) THEN RAISE(ABORT,'Duplicate order item') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM product_overrides WHERE id=NEW.product_id AND active=1 AND archived=0 AND price=NEW.unit_price) THEN RAISE(ABORT,'Product unavailable or price changed') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM orders WHERE id=NEW.order_id AND status IN ('pending','confirmed') AND inventory_released=0) THEN RAISE(ABORT,'Order cannot reserve stock') END;
 UPDATE product_overrides SET
 stock_s=stock_s-CASE WHEN NEW.size='S' THEN NEW.quantity ELSE 0 END,
 stock_m=stock_m-CASE WHEN NEW.size='M' THEN NEW.quantity ELSE 0 END,
 stock_l=stock_l-CASE WHEN NEW.size='L' THEN NEW.quantity ELSE 0 END,
 stock_xl=stock_xl-CASE WHEN NEW.size='XL' THEN NEW.quantity ELSE 0 END,
 stock_xxl=stock_xxl-CASE WHEN NEW.size='XXL' THEN NEW.quantity ELSE 0 END,
 stock_xxxl=stock_xxxl-CASE WHEN NEW.size='XXXL' THEN NEW.quantity ELSE 0 END,
 revision=revision+1,updated_at=datetime('now') WHERE id=NEW.product_id;
 INSERT INTO inventory_changes(product_id,order_id,size,delta,reason,created_at) VALUES(NEW.product_id,NEW.order_id,NEW.size,-NEW.quantity,'order_reserved',datetime('now'));
END;
--> statement-breakpoint
CREATE TRIGGER katha_coupon_claim BEFORE INSERT ON orders WHEN NEW.coupon_id IS NOT NULL
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM coupons WHERE id=NEW.coupon_id AND revision=NEW.coupon_revision AND active=1
 AND (start_at IS NULL OR julianday(start_at)<=julianday('now'))
 AND (end_at IS NULL OR julianday(end_at)>julianday('now'))
 AND minimum_amount<=NEW.subtotal AND (usage_limit IS NULL OR usage_count<usage_limit))
 THEN RAISE(ABORT,'Coupon unavailable or changed') END;
 UPDATE coupons SET usage_count=usage_count+1 WHERE id=NEW.coupon_id;
END;
--> statement-breakpoint
CREATE TRIGGER katha_initial_order_event AFTER INSERT ON orders
BEGIN
 INSERT INTO order_events(order_id,status,note,created_at) VALUES(NEW.id,NEW.status,'Order placed',datetime('now'));
END;
--> statement-breakpoint
CREATE TRIGGER katha_order_transition BEFORE UPDATE OF status ON orders
WHEN OLD.status <> NEW.status
BEGIN
 SELECT CASE WHEN OLD.status IN ('cancelled','delivered') THEN RAISE(ABORT,'Order is final') END;
 SELECT CASE WHEN NEW.status NOT IN ('pending','confirmed','packed','shipped','delivered','cancelled') THEN RAISE(ABORT,'Invalid order status') END;
END;
--> statement-breakpoint
CREATE TRIGGER katha_restore_stock AFTER UPDATE OF status ON orders
WHEN NEW.status='cancelled' AND OLD.status<>'cancelled' AND OLD.inventory_released=0
BEGIN
 UPDATE product_overrides SET
 stock_s=stock_s+COALESCE((SELECT SUM(quantity) FROM order_items WHERE order_id=NEW.id AND product_id=product_overrides.id AND size='S'),0),
 stock_m=stock_m+COALESCE((SELECT SUM(quantity) FROM order_items WHERE order_id=NEW.id AND product_id=product_overrides.id AND size='M'),0),
 stock_l=stock_l+COALESCE((SELECT SUM(quantity) FROM order_items WHERE order_id=NEW.id AND product_id=product_overrides.id AND size='L'),0),
 stock_xl=stock_xl+COALESCE((SELECT SUM(quantity) FROM order_items WHERE order_id=NEW.id AND product_id=product_overrides.id AND size='XL'),0),
 stock_xxl=stock_xxl+COALESCE((SELECT SUM(quantity) FROM order_items WHERE order_id=NEW.id AND product_id=product_overrides.id AND size='XXL'),0),
 stock_xxxl=stock_xxxl+COALESCE((SELECT SUM(quantity) FROM order_items WHERE order_id=NEW.id AND product_id=product_overrides.id AND size='XXXL'),0),
 revision=revision+1,updated_at=datetime('now')
 WHERE id IN(SELECT product_id FROM order_items WHERE order_id=NEW.id);
 INSERT INTO inventory_changes(product_id,order_id,size,delta,reason,created_at)
 SELECT product_id,order_id,size,quantity,'order_cancelled',datetime('now') FROM order_items WHERE order_id=NEW.id;
 UPDATE orders SET inventory_released=1 WHERE id=NEW.id;
 UPDATE coupons SET usage_count=MAX(0,usage_count-1) WHERE id=NEW.coupon_id;
END;
--> statement-breakpoint
CREATE TRIGGER katha_order_status_event AFTER UPDATE OF status ON orders WHEN OLD.status<>NEW.status
BEGIN
 INSERT INTO order_events(order_id,status,note,created_at) VALUES(NEW.id,NEW.status,CASE WHEN NEW.status='cancelled' THEN 'Order cancelled' ELSE 'Order status updated' END,datetime('now'));
END;
--> statement-breakpoint
PRAGMA optimize;
