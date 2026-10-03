import { NextResponse } from "next/server";
import { z } from "zod";
import { customerSchema,itemSchema } from "@/lib/commerce";
import { quoteOrder } from "@/lib/quote-db";
import { cashfreeConfig, cashfreeFetch, onlineCheckoutEnabled } from "@/lib/cashfree";
import { matchesOrderReplay, type StoredReplay } from "@/lib/order-replay";
import { getD1, invalidateCatalogCache } from "@/lib/catalog-db";
import { logEvent, requestId } from "@/lib/monitoring";
import { createOrderIdentity } from "@/lib/order-utils";
import { applyRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const orderSchema = z.object({
  requestId: z.string().uuid(),
  customer: customerSchema,
  couponCode: z.string().trim().max(30).default(""),
  policyAccepted: z.literal(true),
  expectedTotal:z.number().int().positive().optional(),
  paymentMethod: z.enum(["online", "cod"]),
  items: itemSchema,
});

export async function POST(request: Request) {
  const id = requestId(request);
  const limited = await applyRateLimit(request, "checkout", 8);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many checkout attempts. Please wait a minute and try again." }, {
      status: 429,
      headers: { "Retry-After": String(limited.retryAfter), "Cache-Control": "no-store" },
    });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 32_768) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message, fields: parsed.error.flatten() }, { status: 400 });
  const orderInput=parsed.data;

  const db = getD1();
  async function replay() {
    const existing = await db.prepare("SELECT id, amount, payment_method, gateway_session_id, customer_name, email, phone, address, city, state, pincode, landmark, coupon_code FROM orders WHERE request_id=? LIMIT 1")
      .bind(orderInput.requestId).first<StoredReplay>();
    if (!existing) return null;
    const lines = await db.prepare("SELECT product_id AS productId, size, quantity FROM order_items WHERE order_id=? ORDER BY id").bind(existing.id).all<{productId:number;size:string;quantity:number}>();
    if (!matchesOrderReplay(orderInput,existing,lines.results)) return NextResponse.json({error:"This checkout attempt was already used for a different order. Review your bag and submit a new attempt."},{status:409,headers:{"Cache-Control":"no-store"}});
    return NextResponse.json({orderId:existing.id,amount:existing.amount,mode:existing.payment_method,gateway:existing.gateway_session_id?{provider:"cashfree",paymentSessionId:existing.gateway_session_id,mode:cashfreeConfig()?.mode??"sandbox"}:null},{headers:{"Cache-Control":"no-store"}});
  }
  const existing = await replay();
  if (existing) return existing;
  if(parsed.data.paymentMethod==="online"&&!onlineCheckoutEnabled())return NextResponse.json({error:"Online payments are currently unavailable. Choose Cash on Delivery."},{status:503});

  let quote: Awaited<ReturnType<typeof quoteOrder>>;
  try { quote = await quoteOrder(parsed.data.items, parsed.data.couponCode); }
  catch(error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not validate your bag." }, { status: 409 }); }
  if(parsed.data.paymentMethod==="cod"&&!quote.settings.codEnabled)return NextResponse.json({error:"Cash on delivery is currently unavailable. Contact KATHA for assistance."},{status:400});
  const validatedItems = quote.lines;
  const amount = quote.total;
  if(parsed.data.expectedTotal!==undefined&&parsed.data.expectedTotal!==amount)return NextResponse.json({error:"Prices, shipping or your coupon changed. Refresh your bag and review the updated total."},{status:409});
  const { orderId, receipt } = createOrderIdentity();
  let gatewayOrderId: string | null = null;
  let gatewaySessionId: string | null = null;
  let gatewayMode: "sandbox" | "production" = "sandbox";

  if (parsed.data.paymentMethod === "online") {
    const config = cashfreeConfig();
    if (!config) {
      return NextResponse.json(
        { error: "Online payments are currently unavailable. Choose Cash on Delivery." },
        { status: 503 },
      );
    }
    gatewayMode = config.mode;
    let cashfree: Response;
    try {
      const origin = new URL(request.url).origin;
      const phone = parsed.data.customer.phone.replace(/\D/g, "").slice(-10);
      cashfree = await cashfreeFetch("/pg/orders", {
        method: "POST",
        headers: {
          "x-idempotency-key": parsed.data.requestId,
        },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amount,
          order_currency: "INR",
          order_note: receipt,
          customer_details: {
            customer_id: `cust_${orderId}`,
            customer_name: parsed.data.customer.name,
            customer_email: parsed.data.customer.email,
            customer_phone: phone,
          },
          order_meta: {
            return_url: `${origin}/checkout?cashfree_return={order_id}`,
            notify_url: `${origin}/api/payments/cashfree/webhook`,
          },
        }),
      });
    } catch (error) {
      logEvent("error", "cashfree_create_timeout", { requestId: id, message: error instanceof Error ? error.message : "unknown" });
      return NextResponse.json({ error: "Payment service timed out. Please try again." }, { status: 502 });
    }
    const gateway = await cashfree.json().catch(() => null) as {
      cf_order_id?: string | number; order_id?: string; payment_session_id?: string;
    } | null;
    if (!cashfree.ok || !gateway?.payment_session_id || gateway.order_id !== orderId) {
      logEvent("error", "cashfree_create_failed", { requestId: id, status: cashfree.status });
      return NextResponse.json({ error: "Payment service is unavailable. Please try again." }, { status: 502 });
    }
    gatewayOrderId = String(gateway.cf_order_id ?? gateway.order_id);
    gatewaySessionId = gateway.payment_session_id;
  }

  const guardToken = crypto.randomUUID();
  const productGuards=[...new Map(validatedItems.map(item=>[item.product.id,item.product])).values()].map(product=>({
    token:crypto.randomUUID(),statement:db.prepare("INSERT INTO operation_guards(token,passed) VALUES(?,CASE WHEN (SELECT revision FROM product_overrides WHERE id=?)=? THEN 1 ELSE 0 END)")
      .bind(guardToken+"-"+product.id,product.id,product.revision),
  }));
  const statements: D1PreparedStatement[] = [
    ...productGuards.map(guard=>guard.statement),
    db.prepare("INSERT INTO operation_guards(token,passed) VALUES(?,CASE WHEN COALESCE((SELECT revision FROM store_settings WHERE key='store_config'),0)=? THEN 1 ELSE 0 END)").bind(guardToken,quote.settings.revision),
    db.prepare(
      `INSERT INTO orders (
        id, receipt, request_id, customer_name, email, phone, phone_last10, address, city, state, pincode,
        amount, status, payment_status, payment_method, gateway_order_id, gateway_session_id,
        subtotal, shipping_amount, discount_amount, coupon_id, coupon_code, coupon_revision, landmark, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    ).bind(
      orderId, receipt, parsed.data.requestId, parsed.data.customer.name, parsed.data.customer.email,
      parsed.data.customer.phone, parsed.data.customer.phone.replace(/\D/g, "").slice(-10),
      parsed.data.customer.address, parsed.data.customer.city,
      parsed.data.customer.state, parsed.data.customer.pincode, amount,
      parsed.data.paymentMethod === "cod" ? "confirmed" : "pending",
      parsed.data.paymentMethod === "cod" ? "cod" : "pending",
      parsed.data.paymentMethod, gatewayOrderId, gatewaySessionId,
      quote.subtotal,quote.shipping,quote.discount,quote.coupon?.id??null,quote.coupon?.code??null,quote.coupon?.revision??null,parsed.data.customer.landmark,
    ),
  ];

  for (const item of validatedItems) {
    statements.push(
      db.prepare(
        "INSERT INTO order_items (order_id, product_id, product_name, size, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)",
      ).bind(orderId, item.product.id, item.product.name, item.size, item.quantity, item.product.price),
    );
  }
  statements.push(db.prepare("DELETE FROM operation_guards WHERE token=?").bind(guardToken));
  for(const product of new Set(validatedItems.map(item=>item.product.id)))statements.push(db.prepare("DELETE FROM operation_guards WHERE token=?").bind(guardToken+"-"+product));
  try {
    await db.batch(statements);
    invalidateCatalogCache();
  } catch {
    const duplicate = await replay();
    if (duplicate) return duplicate;
    logEvent("warn", "checkout_inventory_conflict", { requestId: id });
    return NextResponse.json({ error: "A selected size just sold out. Refresh your bag and try again." }, { status: 409 });
  }
  logEvent("info", "order_created", { requestId: id, orderId, paymentMethod: parsed.data.paymentMethod });

  return NextResponse.json({
    orderId,
    amount,
    mode: parsed.data.paymentMethod,
    gateway: gatewaySessionId
      ? { provider: "cashfree", paymentSessionId: gatewaySessionId, mode: gatewayMode }
      : null,
  });
}
