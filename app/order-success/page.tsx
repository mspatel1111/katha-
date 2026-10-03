"use client";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {useState} from "react";
import {StoreHeader} from "@/app/store-header";
import {StoreFooter} from "@/app/store-footer";
import {useStore} from "@/app/store-provider";
export default function OrderSuccess(){
 const id=useSearchParams().get("order")??"";const valid=/^KAT[A-Z0-9]{20,40}$/i.test(id);const [copied,setCopied]=useState(false);const store=useStore();
 return <main><StoreHeader/><section className="checkout-success"><p className="eyebrow">Thank you</p><h1>{valid?"Your order is confirmed.":"Order confirmation"}</h1>{valid?<><p>Order ID: <strong>{id}</strong></p><p>Cash on delivery. Keep your order ID to track delivery updates.</p><button onClick={()=>void navigator.clipboard.writeText(id).then(()=>setCopied(true)).catch(()=>setCopied(false))}>{copied?"Copied":"Copy Order ID"}</button><Link href={"/track-order?order="+encodeURIComponent(id)}>Track order</Link></>:<p>Check your order ID on the tracking page.</p>}<Link href="/shop">Continue shopping</Link><a href={"https://wa.me/"+store.settings.whatsapp+"?text="+encodeURIComponent("Hello "+store.settings.storeName+", I need help with order "+id)} target="_blank" rel="noreferrer">WhatsApp KATHA</a></section><StoreFooter/></main>;
}
