import { NextResponse } from "next/server";
import { z } from "zod";
import { sha256Hex, verifyCashfreeWebhook } from "@/lib/cashfree";
import { getD1 } from "@/lib/catalog-db";
import { logEvent, requestId } from "@/lib/monitoring";
import { PAYMENT_UPDATE_SQL } from "@/lib/payment-state";

export const dynamic = "force-dynamic";

const webhookSchema = z.object({
  type: z.string().max(80),
  event_time: z.string().max(80).optional(),
  data: z.object({
    order: z.object({
      order_id: z.string().regex(/^KAT[A-Z0-9]{8,40}$/),
      order_amount: z.number().positive(),
      order_currency: z.literal("INR"),
    }),
    payment: z.object({
      cf_payment_id: z.union([z.string(), z.number()]).transform(String),
      payment_status: z.enum(["SUCCESS", "FAILED", "PENDING", "USER_DROPPED", "CANCELLED"]).or(z.string().max(40)),
      payment_amount: z.number().nonnegative(),
      payment_currency: z.literal("INR"),
    }),
  }),
});

export async function POST(request: Request) {
  const id = requestId(request);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 64 * 1024) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  const signature = request.headers.get("x-webhook-signature") ?? "";
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";
  const rawBody = await request.text();
  if (!(await verifyCashfreeWebhook(signature, timestamp, rawBody))) {
    logEvent("warn", "cashfree_webhook_signature_rejected", { requestId: id });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const parsed = webhookSchema.safeParse(payload);
  if (!parsed.success) {
    logEvent("warn", "cashfree_webhook_payload_rejected", { requestId: id });
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const event = parsed.data;
  const db = getD1();
  const order = await db.prepare(
    "SELECT id, amount, status, payment_status FROM orders WHERE id = ? AND payment_method = 'online' LIMIT 1",
  ).bind(event.data.order.order_id).first<{ id: string; amount: number; status:string; payment_status: string }>();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const orderAmountPaise = Math.round(event.data.order.order_amount * 100);
  const paymentAmountPaise = Math.round(event.data.payment.payment_amount * 100);
  if (orderAmountPaise !== order.amount * 100 || (event.data.payment.payment_status === "SUCCESS" && paymentAmountPaise !== order.amount * 100)) {
    logEvent("error", "cashfree_webhook_amount_mismatch", { requestId: id, orderId: order.id });
    return NextResponse.json({ error: "Amount mismatch" }, { status: 409 });
  }

  const eventId = `${event.type}:${event.data.payment.cf_payment_id}`.slice(0, 180);
  const payloadHash = await sha256Hex(rawBody);
  const paymentStatus = event.data.payment.payment_status;
  const statusUpdate = paymentStatus === "SUCCESS"
    ? "paid"
    : paymentStatus === "FAILED" || paymentStatus === "USER_DROPPED" || paymentStatus === "CANCELLED"
      ? "failed"
      : "pending";

  await db.batch([
    db.prepare(
      `INSERT OR IGNORE INTO payment_events (event_id, order_id, event_type, payload_sha256, received_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
    ).bind(eventId, order.id, event.type, payloadHash),
    db.prepare(
      PAYMENT_UPDATE_SQL+" AND EXISTS(SELECT 1 FROM payment_events WHERE event_id=? AND payload_sha256=?)",
    ).bind(statusUpdate,statusUpdate,statusUpdate,event.data.payment.cf_payment_id,order.id,eventId,payloadHash),
  ]);
  logEvent("info", "cashfree_webhook_processed", { requestId: id, orderId: order.id, paymentStatus });
  if(paymentStatus==="SUCCESS"&&order.status==="cancelled")logEvent("warn","cancelled_order_payment_received",{requestId:id,orderId:order.id});
  return NextResponse.json({ ok: true });
}
