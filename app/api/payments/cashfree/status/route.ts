import { NextResponse } from "next/server";
import { z } from "zod";
import { cashfreeFetch } from "@/lib/cashfree";
import { getD1 } from "@/lib/catalog-db";
import { logEvent, requestId } from "@/lib/monitoring";
import { applyRateLimit } from "@/lib/rate-limit";
import { PAYMENT_UPDATE_SQL } from "@/lib/payment-state";

export const dynamic = "force-dynamic";

const statusSchema = z.object({
  orderId: z.string().regex(/^KAT[A-Z0-9]{8,40}$/),
});

export async function POST(request: Request) {
  const id = requestId(request);
  const limited = await applyRateLimit(request, "payment-status", 20);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(limited.retryAfter), "Cache-Control": "no-store" },
    });
  }
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order" }, { status: 400 });

  const db = getD1();
  const order = await db.prepare(
    "SELECT id, amount, payment_status, payment_method FROM orders WHERE id = ? LIMIT 1",
  ).bind(parsed.data.orderId).first<{ id: string; amount: number; payment_status: string; payment_method: string }>();
  if (!order || order.payment_method !== "online") return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.payment_status === "paid") return NextResponse.json({ paid: true, orderId: order.id }, { headers: { "Cache-Control": "no-store" } });

  let response: Response;
  try {
    response = await cashfreeFetch(`/pg/orders/${encodeURIComponent(order.id)}`, { method: "GET" });
  } catch (error) {
    logEvent("error", "cashfree_status_unavailable", { requestId: id, message: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Payment status is temporarily unavailable" }, { status: 502 });
  }
  const gateway = await response.json().catch(() => null) as {
    order_id?: string; order_status?: string; order_amount?: number; order_currency?: string;
  } | null;
  if (!response.ok || !gateway || gateway.order_id !== order.id) {
    return NextResponse.json({ error: "Payment status could not be verified" }, { status: 502 });
  }
  if (gateway.order_currency !== "INR" || Math.round((gateway.order_amount ?? -1) * 100) !== order.amount * 100) {
    logEvent("error", "cashfree_status_amount_mismatch", { requestId: id, orderId: order.id });
    return NextResponse.json({ error: "Payment amount could not be verified" }, { status: 409 });
  }

  const paid = gateway.order_status === "PAID";
  if (paid) {
    await db.prepare(PAYMENT_UPDATE_SQL).bind("paid","paid","paid",null,order.id).run();
  }
  return NextResponse.json({ paid, orderId: order.id, status: gateway.order_status ?? "UNKNOWN" }, {
    headers: { "Cache-Control": "no-store" },
  });
}
