"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogTrigger,DialogDescription } from "@/components/ui/dialog";
import { ResponsiveImage } from "@/app/responsive-image";
import { FavoriteButton } from "@/app/favorites";
import { SizeTable } from "@/app/size-guide";
import { SIZES,money,productHref,type Product,type Size } from "@/lib/catalog";
import { useLocalValue,writeLocal } from "@/lib/browser-store";
import {parseCart} from "@/lib/cart";
export function ProductDetails({product,whatsapp}:{product:Product;whatsapp:string}){
  const [selectedImage,setSelectedImage]=useState(Math.max(0,product.images.findIndex(image=>image.primary)));
  const [size,setSize]=useState<Size>(SIZES.find(size=>product.stock[size]>0)??"S");
  const [quantity,setQuantity]=useState(1);
  const [message,setMessage]=useState("");
  const cart=parseCart(useLocalValue("katha-cart-v1"));
  const max=product.stock[size];
  const gallery=product.images.length?product.images:[{url:product.image,alt:product.name,displayOrder:0,primary:true}];
  const image=gallery[selectedImage]??gallery[0];
  useEffect(()=>{
    let ids:number[]=[];
    try{const raw=JSON.parse(localStorage.getItem("katha-recent-v1")??"[]");ids=Array.isArray(raw)?raw.filter(id=>Number.isInteger(id)&&id>0):[];}catch{}
    writeLocal("katha-recent-v1",[product.id,...ids.filter(id=>id!==product.id)].slice(0,8));
  },[product.id]);
  const add=()=>{
    const key=product.id+"-"+size;
    const next=Math.min(10,max,(cart[key]??0)+quantity);
    writeLocal("katha-cart-v1",{...cart,[key]:next});
    let prices:Record<string,number>={};try{prices=JSON.parse(localStorage.getItem("katha-cart-prices-v1")??"{}");}catch{/* Ignore corrupt device-local state. */}
    writeLocal("katha-cart-prices-v1",{...prices,[key]:product.price});
    setMessage(next<(cart[key]??0)+quantity?"Your bag now contains all available stock in this size.":"Added to your bag.");
  };
  return <section className="product-layout">
    <div className="product-gallery"><Dialog><DialogTrigger asChild><button className="gallery-main" aria-label={"Enlarge "+product.name}><ResponsiveImage src={image.url} alt={image.alt||product.name} sizes="(max-width: 680px) 100vw, 55vw" fetchPriority="high"/></button></DialogTrigger><DialogContent className="image-preview"><DialogHeader><DialogTitle>{product.name}</DialogTitle><DialogDescription>Enlarged product view</DialogDescription></DialogHeader><ResponsiveImage src={image.url} alt={image.alt||product.name} sizes="90vw"/></DialogContent></Dialog>
    <div className="gallery-thumbnails">{gallery.map((entry,index)=><button key={entry.url} aria-label={"Show image "+(index+1)} aria-pressed={index===selectedImage} onClick={()=>setSelectedImage(index)}><ResponsiveImage src={entry.url} alt={entry.alt||product.name} loading="lazy" sizes="90px"/></button>)}</div></div>
    <div className="product-info"><p className="eyebrow">{product.label??product.category}</p><h1>{product.name}</h1>
      <div className="pdp-price"><strong>{money(product.price)}</strong>{product.oldPrice&&<del>{money(product.oldPrice)}</del>}</div><p className="tax-note">Inclusive of applicable taxes · {product.sku}</p>
      <p>{product.color} · {product.category}</p>
      <div className="size-heading"><strong>Select size</strong><Dialog><DialogTrigger asChild><button className="text-link">Size guide</button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Find your fit</DialogTitle><DialogDescription>Compare your measurements before choosing a size.</DialogDescription></DialogHeader><SizeTable/></DialogContent></Dialog></div>
      <div className="pdp-sizes">{SIZES.map(item=><button key={item} aria-pressed={size===item} disabled={!product.stock[item]} className={size===item?"active":""} onClick={()=>{setSize(item);setQuantity(1);setMessage("");}}>{item}<small>{product.stock[item]?"Available":"Sold out"}</small></button>)}</div>
      <p role="status">{max===0?"This size is sold out.":max<=product.lowStockThreshold?"Only "+max+" left in this size.":"In stock"}</p>
      <div className="pdp-quantity"><label htmlFor="product-quantity">Quantity</label><div><button type="button" aria-label="Decrease quantity" disabled={!max||quantity<=1} onClick={()=>setQuantity(q=>Math.max(1,q-1))}>−</button><input id="product-quantity" type="number" min={1} max={Math.max(1,Math.min(10,max))} value={quantity} disabled={!max} onChange={e=>setQuantity(Math.max(1,Math.min(10,max,Number(e.target.value)||1)))}/><button type="button" aria-label="Increase quantity" disabled={!max||quantity>=Math.min(10,max)} onClick={()=>setQuantity(q=>Math.min(10,max,q+1))}>+</button></div></div>
      <button className="pdp-add" disabled={!max} onClick={add}>Add to bag · {money(product.price*quantity)}</button>
      {message&&<p role="status">{message} <button className="text-link" onClick={()=>window.dispatchEvent(new Event("katha-open-bag"))}>View bag</button></p>}
      <FavoriteButton productId={product.id} showLabel/>
      <a className="product-whatsapp" href={"https://wa.me/"+whatsapp+"?text="+encodeURIComponent("Hello KATHA, please tell me about "+product.name+" ("+product.sku+"), size "+size+".")} target="_blank" rel="noreferrer">Ask about this product on WhatsApp</a>
      <details open><summary>Product details</summary><p>{product.description||"Please contact KATHA for details about this style."}</p><dl className="product-facts">{([["Fabric",product.fabric],["Work / embroidery",product.work],["Occasion",product.occasion],["Fit",product.fit],["Length",product.length],["Dispatch",product.dispatchTime]]).filter(([,value])=>value).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></details>
      <details><summary>Wash care</summary><p>{product.washCare||"Confirm the care instructions with our team before washing."}</p></details>
      <details><summary>Shipping & policies</summary><p>Delivery across India. View shipping charges in your bag.</p><Link href="/policies#shipping">Shipping policy</Link> · <Link href="/policies#returns">Returns & exchanges</Link></details>
    </div>
  </section>;
}
export function RecentlyViewed({currentId}:{currentId:number}){
 const raw=useLocalValue("katha-recent-v1",true);
 const ids=Array.isArray(raw)?raw.filter((id):id is number=>Number.isInteger(id)&&id>0&&id!==currentId).slice(0,4):[];
 const key=ids.join(",");const [products,setProducts]=useState<Product[]>([]);
 useEffect(()=>{if(!key)return;const abort=new AbortController();async function load(){try{const r=await fetch("/api/products?ids="+key,{cache:"no-store",signal:abort.signal});if(r.ok)setProducts((await r.json<{products:Product[]}>()).products);}catch{/* Recently viewed is nonessential; the current product remains available. */}}void load();return()=>abort.abort();},[key]);
 const recent=ids.flatMap(id=>products.filter(p=>p.id===id&&p.active&&!p.archived));
 if(!recent.length)return null;
 return <section className="related-products"><h2>Recently viewed</h2><div className="shop-grid">{recent.map(p=><Link href={productHref(p)} key={p.id}><ResponsiveImage src={p.image} alt={p.name} loading="lazy"/><h3>{p.name}</h3><p>{money(p.price)}</p></Link>)}</div></section>;
}
