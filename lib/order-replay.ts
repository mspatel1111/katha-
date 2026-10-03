type Line = { productId: number; size: string; quantity: number };
type Customer = { name: string; email: string; phone: string; address: string; city: string; state: string; pincode: string; landmark?: string };
export type ReplayInput = { customer: Customer; items: Line[]; couponCode: string; paymentMethod: string; expectedTotal?: number };
export type StoredReplay = { id: string; amount: number; payment_method: string; gateway_session_id: string | null; customer_name: string; email: string; phone: string; address: string; city: string; state: string; pincode: string; landmark: string | null; coupon_code: string | null };
function linesKey(lines: Line[]) {
  const merged = new Map<string, number>();
  for (const line of lines) {
    const key = line.productId + "-" + line.size;
    merged.set(key, (merged.get(key) ?? 0) + line.quantity);
  }
  return JSON.stringify([...merged].sort(([a], [b]) => a.localeCompare(b)));
}
export function matchesOrderReplay(input: ReplayInput, stored: StoredReplay, lines: Line[]) {
  const customer = input.customer;
  return stored.customer_name === customer.name && stored.email === customer.email
    && stored.phone === customer.phone && stored.address === customer.address
    && stored.city === customer.city && stored.state === customer.state && stored.pincode === customer.pincode
    && (stored.landmark ?? "") === (customer.landmark ?? "")
    && (stored.coupon_code ?? "").toUpperCase() === input.couponCode.toUpperCase()
    && stored.payment_method === input.paymentMethod
    && (input.expectedTotal === undefined || input.expectedTotal === stored.amount)
    && linesKey(input.items) === linesKey(lines);
}
