"use client";
import Link from "next/link";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {StoreHeader} from "@/app/store-header";
import {StoreFooter} from "@/app/store-footer";
import {BagLines,ShippingProgress} from "@/app/cart-drawer";
import {useBag} from "@/app/store-provider";
import {customerSchema,INDIAN_STATES} from "@/lib/commerce";
import {money} from "@/lib/catalog";
import {readSession,writeSession,removeSession} from "@/lib/session-store";
type Quote={subtotal:number;shipping:number;discount:number;total:number};
export default function CheckoutPage(){
 const bag=useBag();const router=useRouter();const lock=useRef(false);
 const [coupon,setCoupon]=useState("");const [applied,setApplied]=useState("");const [quote,setQuote]=useState<Quote|null>(null);
 const [quoting,setQuoting]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const items=bag.lines.map(line=>({productId:line.product?.id??0,size:line.size,quantity:line.quantity}));
 const signature=JSON.stringify(items);
 const refresh=bag.refresh;
 useEffect(()=>{void refresh().catch(error=>setError(error.message));},[refresh]);
 useEffect(()=>{
  if(!bag.ready||!items.length)return;
  const abort=new AbortController();
  async function update(){setQuoting(true);setQuote(null);try{
   const response=await fetch("/api/checkout/quote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:JSON.parse(signature),couponCode:applied}),signal:abort.signal});
   const data=await response.json<Quote&{error?:string}>();if(!response.ok)throw new Error(data.error??"Could not calculate your order.");
   setQuote(data);setError("");
  }catch(error){if(!abort.signal.aborted)setError(error instanceof Error?error.message:"Could not calculate your order.");}
  finally{if(!abort.signal.aborted)setQuoting(false);}}
  void update();return()=>abort.abort();
 },[signature,applied,bag.ready,items.length]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(lock.current)return;
  const form=new FormData(event.currentTarget);const customer=customerSchema.safeParse(Object.fromEntries(form));
  if(!customer.success){setError(customer.error.issues[0].message);return;}
  if(form.get("policyAccepted")!=="on"){setError("Please accept the store policies before placing your order.");return;}
  if(bag.invalid||!quote||quoting){setError("Please refresh and review your bag before ordering.");return;}
  lock.current=true;setBusy(true);setError("");
  try{
   const payload={customer:customer.data,items,couponCode:applied,policyAccepted:true,paymentMethod:"cod",expectedTotal:quote.total};
   const fingerprint=JSON.stringify(payload);const stored=readSession("katha-checkout-attempt");
   let attempt:{fingerprint:string;id:string}|null=null;try{attempt=stored?JSON.parse(stored):null;}catch{/* Discard invalid local retry state. */}
   const id=attempt?.fingerprint===fingerprint&&typeof attempt.id==="string"&&/^[0-9a-f-]{36}$/i.test(attempt.id)?attempt.id:crypto.randomUUID();
   writeSession("katha-checkout-attempt",JSON.stringify({fingerprint,id}));
   const response=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,requestId:id})});
   const data=await response.json<{error?:string;orderId:string;amount:number}>();if(!response.ok)throw new Error(data.error??"Your order could not be placed.");
   writeSession("katha-last-order",JSON.stringify({id:data.orderId,amount:data.amount}));
   removeSession("katha-checkout-attempt");bag.clear();router.replace("/order-success?order="+encodeURIComponent(data.orderId));
  }catch(error){setError(error instanceof Error?error.message:"Your order could not be placed. Please retry.");void refresh().catch(()=>undefined);}
  finally{lock.current=false;setBusy(false);}
 }
 return <main className="checkout-page"><StoreHeader/><div className="checkout-layout">
  <form className="checkout-form" onSubmit={submit}><p className="eyebrow">Guest checkout</p><h1>Checkout</h1>
   <div className="form-grid">
    <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={100}/></label>
    <label>Mobile number<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="10-digit Indian mobile"/></label>
    <label className="full">Email<input name="email" type="email" autoComplete="email" required maxLength={160}/></label>
    <label className="full">Delivery address<textarea name="address" autoComplete="street-address" required minLength={8} maxLength={250} rows={3}/></label>
    <label className="full">Landmark (optional)<input name="landmark" maxLength={150}/></label>
    <label>City<input name="city" autoComplete="address-level2" required minLength={2} maxLength={80}/></label>
    <label>State<select name="state" autoComplete="address-level1" defaultValue="Gujarat">{INDIAN_STATES.map(state=><option key={state}>{state}</option>)}</select></label>
    <label>Pincode<input name="pincode" inputMode="numeric" autoComplete="postal-code" pattern="[1-9][0-9]{5}" maxLength={6} required/></label>
   </div>
   <div className="payment-choice"><h2>Cash on delivery</h2><p>Pay when your order arrives. Online payments are currently unavailable.</p>{!bag.settings.codEnabled&&<p role="alert">COD is currently unavailable. Please contact the store.</p>}</div>
   <label className="policy-checkbox"><input type="checkbox" name="policyAccepted" required/> <span>I accept the <Link href="/policies">store, shipping and cancellation policies</Link>.</span></label>
   {error&&<p className="form-error" role="alert">{error}</p>}
   <button className="place-order" disabled={busy||quoting||bag.invalid||!quote||!items.length||!bag.settings.codEnabled}>{busy?"Placing your order…":"Place COD order"}</button>
  </form>
  <aside className="order-summary"><h2>Your bag ({bag.count})</h2>{bag.error&&<p role="alert">{bag.error}</p>}{!bag.ready?<p role="status">Refreshing your bag…</p>:<BagLines/>}
   {!bag.count&&<p>Your bag is empty. <Link href="/shop">Continue shopping</Link></p>}
   <ShippingProgress/><div className="coupon-entry"><label htmlFor="coupon">Coupon code</label><div><input id="coupon" value={coupon} maxLength={30} onChange={e=>setCoupon(e.target.value.toUpperCase())}/><button type="button" disabled={!coupon.trim()||quoting} onClick={()=>setApplied(coupon.trim())}>Apply</button>{applied&&<button type="button" onClick={()=>{setApplied("");setCoupon("");}}>Remove</button>}</div></div>
   {quoting&&<p role="status">Checking prices and shipping…</p>}
   {quote&&<div className="summary-total"><p><span>Subtotal</span><span>{money(quote.subtotal)}</span></p><p><span>Shipping</span><span>{quote.shipping?money(quote.shipping):"Free"}</span></p>{quote.discount>0&&<p><span>Discount ({applied})</span><span>−{money(quote.discount)}</span></p>}<p className="grand-total"><span>Total</span><strong>{money(quote.total)}</strong></p></div>}
  </aside></div><StoreFooter/></main>;
}
