// Gateway events record payment independently from fulfilment. Late events cannot
// reopen a cancelled order or regress a packed/shipped/delivered order.
export const PAYMENT_UPDATE_SQL = `UPDATE orders SET
  payment_status=CASE WHEN ?='pending' AND payment_status='failed' THEN payment_status ELSE ? END,
  status=CASE WHEN ?='paid' AND status='pending' THEN 'confirmed' ELSE status END,
  gateway_payment_id=COALESCE(?,gateway_payment_id),updated_at=datetime('now')
  WHERE id=? AND payment_method='online' AND payment_status NOT IN ('paid','refunded')`;
