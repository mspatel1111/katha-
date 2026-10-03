"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, Loader2, PackageCheck, PackageSearch } from "lucide-react";
import { StoreHeader } from "@/app/store-header";
import { StoreFooter } from "@/app/store-footer";
import { Input } from "@/components/ui/input";
import {useSearchParams} from "next/navigation";

type TrackedOrder = {
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
  items: Array<{ product_name: string; size: string; quantity: number; unit_price: number }>;
};

const stages = ["confirmed", "packed", "shipped", "delivered"];
const money = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(value);

export default function TrackOrderPage() {
  const search=useSearchParams();
  const [orderId, setOrderId] = useState(search.get("order")??"");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(""); setOrder(null);
    try{const response = await fetch("/api/orders/track", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, phone }),
    });
    const data = await response.json() as { order?: TrackedOrder; error?: string };
    if (response.ok && data.order) setOrder(data.order);
    else setError(data.error ?? "Could not track this order.");
    }catch{setError("Could not reach KATHA. Please try again.");}finally{setLoading(false);}
  };

  const currentStage = order ? stages.indexOf(order.status) : -1;

  return (
    <main className="track-page">
      <StoreHeader />
      <section className="track-layout">
        <div className="track-intro">
          <p className="eyebrow">KATHA delivery</p>
          <h1>Track your<br />order.</h1>
          <p>Enter the order ID from your confirmation and the phone number used at checkout.</p>
          <div className="track-note"><PackageSearch /><span><strong>Where is my order ID?</strong><small>It begins with KAT and appears after checkout.</small></span></div>
        </div>
        <div className="track-panel">
          <form onSubmit={submit} className="track-form">
            <label>Order ID<Input value={orderId} onChange={(event) => setOrderId(event.target.value.toUpperCase())} placeholder="KAT…" autoComplete="off" required /></label>
            <label>Checkout phone number<Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit mobile number" inputMode="tel" autoComplete="tel" required /></label>
            <button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <>Track order <ArrowRight /></>}</button>
          </form>
          {error && <p className="track-error" role="alert">{error}</p>}
          {order && (
            <section className="tracking-result" aria-live="polite">
              <div className="tracking-summary"><div><small>Order</small><strong>{order.id}</strong></div><div><small>Total</small><strong>{money(order.amount)}</strong></div></div>
              {order.status === "cancelled" ? <p className="track-cancelled">This order has been cancelled. Contact KATHA for assistance.</p> : (
                <ol className="tracking-steps">
                  {stages.map((stage, index) => <li key={stage} className={index <= currentStage ? "complete" : ""}><i>{index <= currentStage ? <Check /> : index + 1}</i><span>{stage}</span></li>)}
                </ol>
              )}
              <div className="tracking-items">
                {order.items.map((item, index) => <p key={`${item.product_name}-${index}`}><PackageCheck /><span><strong>{item.product_name}</strong><small>Size {item.size} · Qty {item.quantity}</small></span><b>{money(item.unit_price * item.quantity)}</b></p>)}
              </div>
              {(order.courier_name||order.tracking_number)&&<dl className="tracking-shipment">
                {order.courier_name&&<div><dt>Courier</dt><dd>{order.courier_name}</dd></div>}
                {order.tracking_number&&<div><dt>Tracking number</dt><dd>{order.tracking_number}</dd></div>}
                {order.shipped_at&&<div><dt>Shipped</dt><dd>{order.shipped_at} UTC</dd></div>}
                {order.delivered_at&&<div><dt>Delivered</dt><dd>{order.delivered_at} UTC</dd></div>}
              </dl>}
              <p className="tracking-payment">Payment: <strong>{order.payment_status}</strong> · {order.payment_method === "cod" ? "Cash on delivery" : "Online payment"}</p>
            </section>
          )}
        </div>
      </section>
      <StoreFooter />
    </main>
  );
}
