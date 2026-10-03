import {notFound} from "next/navigation";
import {getAdmin} from "@/lib/admin-auth";
import {getD1} from "@/lib/catalog-db";
import {getSettings} from "@/lib/settings-db";
import {money} from "@/lib/catalog";
import {PrintButton} from "./print-button";
export const dynamic="force-dynamic";
export const metadata={title:"Order slip | KATHA",robots:{index:false,follow:false}};
export default async function Invoice({params}:{params:Promise<{id:string}>}){
 if(!(await getAdmin()))notFound();const {id}=await params;const db=getD1();
 const order=await db.prepare("SELECT * FROM orders WHERE id=?").bind(id).first<Record<string,string|number|null>>();if(!order)notFound();
 const items=await db.prepare("SELECT * FROM order_items WHERE order_id=?").bind(id).all<{product_name:string;size:string;quantity:number;unit_price:number}>();
 const settings=await getSettings();
 return <main className="order-slip"><header><h1>{settings.storeName}</h1><p>{settings.address}</p><p>{settings.phone}</p></header><h2>Order slip {id}</h2><p>{order.created_at} · {order.payment_method} · {order.payment_status}</p><h3>Deliver to</h3><p>{order.customer_name} · {order.phone}</p><address>{order.address} {order.landmark}<br/>{order.city}, {order.state} {order.pincode}</address>
 <table><thead><tr><th>Style</th><th>Size</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>{items.results.map((item,i)=><tr key={i}><td>{item.product_name}</td><td>{item.size}</td><td>{item.quantity}</td><td>{money(item.unit_price)}</td><td>{money(item.quantity*item.unit_price)}</td></tr>)}</tbody></table>
 <p>Shipping: {money(Number(order.shipping_amount))} · Discount: {money(Number(order.discount_amount))}</p><h3>Total {money(Number(order.amount))}</h3><p>This is an order slip, not a GST tax invoice.</p><PrintButton/></main>;
}
