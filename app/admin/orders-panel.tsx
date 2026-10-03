"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {money} from "@/lib/catalog";
import {useStore} from "@/app/store-provider";
type Order={id:string;customer_name:string;phone:string;email:string;address:string;landmark:string;city:string;state:string;pincode:string;amount:number;subtotal:number;shipping_amount:number;discount_amount:number;coupon_code:string;status:string;payment_status:string;payment_method:string;created_at:string;admin_notes:string;cancellation_reason:string;courier_name:string;tracking_number:string;shipped_at:string|null;delivered_at:string|null;items:Array<{product_name:string;size:string;quantity:number;unit_price:number}>;timeline:Array<{id:number;status:string;note:string;created_at:string}>};
async function getOrders(query=""){const r=await fetch("/api/admin/orders?"+query,{cache:"no-store"});const data=await r.json<{error?:string;orders:Order[];total:number;order:Order}>();if(!r.ok)throw new Error(data.error??"Could not load orders.");return data;}
export function OrdersPanel(){
 const {settings}=useStore();
 const [orders,setOrders]=useState<Order[]>([]);const [total,setTotal]=useState(0);const [page,setPage]=useState(1);
 const [selected,setSelected]=useState<Order|null>(null);const [form,setForm]=useState<Order|null>(null);
 const [search,setSearch]=useState("");const [status,setStatus]=useState("");const [payment,setPayment]=useState("");const [from,setFrom]=useState("");const [to,setTo]=useState("");
 const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 const query=new URLSearchParams({q:search,status,payment,from,to,page:String(page)}).toString();
 useEffect(()=>{let active=true;getOrders(query).then(data=>{if(active){setOrders(data.orders);setTotal(data.total);}}).catch(error=>{if(active)setMessage(error.message);});return()=>{active=false;};},[query]);
 const open=async(id:string)=>{try{const data=await getOrders("id="+encodeURIComponent(id));setSelected(data.order);setForm(data.order);}catch(error){setMessage(error instanceof Error?error.message:"Could not open order.");}};
 const save=async()=>{
  if(!selected||!form)return;setBusy(true);
  try{const r=await fetch("/api/admin/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:form.id,status:form.status,expectedStatus:selected.status,adminNotes:form.admin_notes,cancellationReason:form.cancellation_reason,courierName:form.courier_name,trackingNumber:form.tracking_number,paymentStatus:form.payment_status})});const data=await r.json<{error?:string;orders:Order[];total:number;order:Order}>();if(!r.ok)throw new Error(data.error);await open(form.id);const list=await getOrders(query);setOrders(list.orders);setMessage("Order updated.");}
  catch(error){setMessage(error instanceof Error?error.message:"Could not update order.");}finally{setBusy(false);}
 };
 return <div className="orders-card"><h2>Orders</h2><div className="admin-order-filters">
 <label>Search<input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Order ID, customer or phone"/></label>
 <label>Order status<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">All</option>{["pending","confirmed","packed","shipped","delivered","cancelled"].map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Payment<select value={payment} onChange={e=>{setPayment(e.target.value);setPage(1);}}><option value="">All</option>{["cod","paid","pending","failed","refunded"].map(v=><option key={v}>{v}</option>)}</select></label>
 <label>From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>To<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><a href={"/api/admin/orders?"+query+"&export=csv"} download>Export filtered CSV</a></div>
 {message&&<p role="status">{message}</p>}
 {selected&&form?<section className="order-detail"><div className="admin-toolbar"><h3>{selected.id}</h3><Button variant="outline" onClick={()=>setSelected(null)}>Close detail</Button></div>
 <p>{selected.customer_name} · {selected.phone} · {selected.email}</p><address>{selected.address}{selected.landmark?", "+selected.landmark:""}, {selected.city}, {selected.state} {selected.pincode}</address>
 <table><thead><tr><th>Style</th><th>Size</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr></thead><tbody>{selected.items.map((item,index)=><tr key={index}><td>{item.product_name}</td><td>{item.size}</td><td>{item.quantity}</td><td>{money(item.unit_price)}</td><td>{money(item.quantity*item.unit_price)}</td></tr>)}</tbody></table>
 <p>Subtotal {money(selected.subtotal||selected.items.reduce((a,b)=>a+b.unit_price*b.quantity,0))} · Shipping {money(selected.shipping_amount)} · Discount {money(selected.discount_amount)} {selected.coupon_code||""}</p><p><strong>Total {money(selected.amount)}</strong> · {selected.payment_method} · {selected.payment_status}</p>
 <div className="form-grid"><label>Order status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{["pending","confirmed","packed","shipped","delivered","cancelled"].map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Payment status<select value={form.payment_status} onChange={e=>setForm({...form,payment_status:e.target.value})} disabled={form.payment_method!=="cod"}>{["cod","paid","pending","failed","refunded"].map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Courier name<input value={form.courier_name} onChange={e=>setForm({...form,courier_name:e.target.value})}/></label><label>Tracking number<input value={form.tracking_number} onChange={e=>setForm({...form,tracking_number:e.target.value})}/></label>
 <label className="full">Internal notes<textarea value={form.admin_notes} onChange={e=>setForm({...form,admin_notes:e.target.value})}/></label><label className="full">Cancellation reason<textarea value={form.cancellation_reason} onChange={e=>setForm({...form,cancellation_reason:e.target.value})}/></label></div>
 <p>Shipped: {selected.shipped_at??"Not yet"} · Delivered: {selected.delivered_at??"Not yet"}</p><Button disabled={busy} onClick={()=>void save()}>{busy?"Saving…":"Save order"}</Button>
 <div className="admin-toolbar"><Link href={"/admin/orders/"+selected.id+"/invoice"} target="_blank">Printable order slip</Link><a target="_blank" rel="noreferrer" href={"https://wa.me/91"+selected.phone.replace(/\D/g,"").slice(-10)+"?text="+encodeURIComponent("Hello "+selected.customer_name+", this is "+settings.storeName+" about your order "+selected.id+".")}>WhatsApp customer</a></div>
 <h4>Order timeline</h4><ol>{selected.timeline.map(event=><li key={event.id}>{event.created_at} — {event.status}: {event.note}</li>)}</ol></section>:<>
 <div className="table-scroll"><table className="orders-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th><th>Placed</th><th>Action</th></tr></thead><tbody>{orders.map(order=><tr key={order.id}><td>{order.id}</td><td>{order.customer_name}<br/>{order.phone}</td><td>{money(order.amount)}</td><td>{order.status}</td><td>{order.payment_status}</td><td>{order.created_at}</td><td><Button variant="outline" onClick={()=>void open(order.id)}>View</Button></td></tr>)}</tbody></table></div>
 {!orders.length&&<p>No matching orders.</p>}<div className="pagination"><Button variant="outline" disabled={page===1} onClick={()=>setPage(page-1)}>Previous</Button><span>Page {page} · {total} orders</span><Button variant="outline" disabled={page*50>=total} onClick={()=>setPage(page+1)}>Next</Button></div></>}
 </div>;
}
