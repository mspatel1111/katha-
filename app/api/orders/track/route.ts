import { NextResponse } from "next/server";
import { z } from "zod";
import { getD1 } from "@/lib/catalog-db";
import { applyRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const lookupSchema = z.object({
  orderId: z.string().trim().toUpperCase().regex(/^KAT[A-Z0-9]{5,30}$/),
  phone: z.string().trim().regex(/^[0-9+() -]{10,18}$/),
});

type OrderRow = {
  id: string;
  amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  courier_name: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
};

type OrderItemRow = {
  product_name: string;
  size: string;
  quantity: number;
  unit_price: number;
};

export async function POST(request: Request) {
  const limited = await applyRateLimit(request, "track-order", 20);
  if (!limited.allowed) return NextResponse.json({ error: "Too many lookups. Please wait a minute." }, {
    status: 429,
    headers: { "Retry-After": String(limited.retryAfter), "Cache-Control": "no-store" },
  });
  if (Number(request.headers.get("content-length") ?? 0) > 8_192) return NextResponse.json({ error: "Request too large" }, { status: 413 });
  const parsed = lookupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid KATHA order ID and phone number." }, { status: 400 });
  }

  const phone = parsed.data.phone.replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) {
    return NextResponse.json({ error: "Enter the 10-digit phone number used at checkout." }, { status: 400 });
  }

  const db = getD1();
  const order = await db.prepare(
    `SELECT id, amount, status, payment_status, payment_method, created_at,
            courier_name, tracking_number, shipped_at, delivered_at
     FROM orders
     WHERE id = ?
       AND phone_last10 = ?
     LIMIT 1`,
  ).bind(parsed.data.orderId, phone).first<OrderRow>();

  if (!order) {
    return NextResponse.json({ error: "Order not found. Check the order ID and checkout phone number." }, { status: 404 });
  }

  const items = await db.prepare(
    "SELECT product_name, size, quantity, unit_price FROM order_items WHERE order_id = ? ORDER BY id ASC",
  ).bind(order.id).all<OrderItemRow>();

  return NextResponse.json({ order: { ...order, items: items.results } }, { headers: { "Cache-Control": "private, no-store" } });
}
