"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs,TabsContent,TabsList,TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ResponsiveImage } from "@/app/responsive-image";
import { blankProduct,money,SIZES,type Product } from "@/lib/catalog";
import { ProductForm } from "./product-form";
import { SettingsPanel,CouponsPanel } from "./settings-panel";
import { OrdersPanel } from "./orders-panel";
import {InventoryHistory} from "./inventory-history";
type AdminOrder={id:string;customer_name:string;phone:string;amount:number;status:string;payment_status:string;created_at:string};
async function loadData(){
  const [catalog,orders]=await Promise.all([fetch("/api/admin/catalog",{cache:"no-store"}),fetch("/api/admin/orders",{cache:"no-store"})]);
  if(!catalog.ok||!orders.ok)throw new Error("Store data could not load. Try again.");
  return {products:(await catalog.json<{products:Product[]}>()).products as Product[],orders:(await orders.json<{orders:AdminOrder[]}>()).orders as AdminOrder[]};
}
export function AdminDashboard({displayName,signOutHref}:{displayName:string;signOutHref:string}){
  const [data,setData]=useState<{products:Product[];orders:AdminOrder[]}>({products:[],orders:[]});
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  const [selected,setSelected]=useState<Product|null>(null);
  const [search,setSearch]=useState("");
  const [tab,setTab]=useState("products");
  useEffect(()=>{
    let active=true;
    loadData().then(next=>{if(active){setData(next);setLoading(false);}}).catch(error=>{if(active){setMessage(error.message);setLoading(false);}});
    return()=>{active=false;};
  },[]);
  const refresh=async()=>{try{setData(await loadData());}catch(error){setMessage(error instanceof Error?error.message:"Could not refresh.");}};
  const archive=async(product:Product)=>{
    const response=await fetch("/api/admin/catalog",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:product.id})});
    if(response.ok){setMessage("Product archived. Its order history and images are preserved.");await refresh();}else setMessage("Could not archive product.");
  };
  const lowStock=data.products.filter(p=>p.active&&!p.archived&&SIZES.some(size=>p.stock[size]<=p.lowStockThreshold));
  return <main className="admin-page">
    <header className="admin-header"><div><Link href="/" className="admin-back">Storefront</Link><ResponsiveImage src="/katha-logo.webp" alt="KATHA Ethnic"/></div><div className="admin-user"><span>{displayName}</span><a href={signOutHref} target="_top">Sign out</a></div></header>
    <section className="admin-intro"><div><p className="eyebrow">Store management</p><h1>KATHA Admin</h1></div><Button onClick={()=>void refresh()}>Refresh</Button></section>
    <div className="admin-stats"><article><strong>{data.products.length}</strong><span>Products</span></article><article><strong>{data.orders.length}</strong><span>Recent orders</span></article><article><strong>{lowStock.length}</strong><span>Low-stock styles</span></article><article><strong>{data.products.reduce((sum,p)=>sum+SIZES.reduce((total,size)=>total+p.stock[size],0),0)}</strong><span>Units in stock</span></article></div>
    {message&&<p role="status" className="admin-message">{message}</p>}
    {loading?<p role="status">Loading store data…</p>:<Tabs value={tab} onValueChange={setTab}>
      <TabsList variant="line"><TabsTrigger value="products">Products</TabsTrigger><TabsTrigger value="orders">Orders</TabsTrigger><TabsTrigger value="inventory">Low stock</TabsTrigger><TabsTrigger value="coupons">Coupons</TabsTrigger><TabsTrigger value="settings">Store & policies</TabsTrigger></TabsList>
      <TabsContent value="products">{selected?<ProductForm key={selected.id+"-"+selected.revision} product={selected} onCancel={()=>setSelected(null)} onSaved={async()=>{await refresh();setSelected(null);setMessage("Product saved.");}}/>:<>
        <div className="admin-toolbar"><label>Search products<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, SKU or category"/></label><Button onClick={()=>setSelected(blankProduct())}>Add product</Button></div>
        {data.products.some(p=>p.sku.startsWith("KATHA-DRAFT-")&&!p.active)&&<p role="status">Draft styles are hidden from customers. Set real prices, stock and product photos before making them visible.</p>}
        <div className="admin-product-list">{data.products.filter(p=>(p.name+" "+p.sku+" "+p.category).toLowerCase().includes(search.toLowerCase())).map(p=><article key={p.id}><ResponsiveImage src={p.image} alt={p.name} loading="lazy" sizes="90px"/><div><h2>{p.name}</h2><p>{p.sku} · {p.category} · {p.price?money(p.price):"Price pending"}</p><p>{p.archived?"Archived":p.active?"Visible":p.label==="Draft"?"Draft · hidden":"Hidden"}</p></div><Button variant="outline" onClick={()=>setSelected(p)}>Edit</Button><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" disabled={p.archived}>Archive</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Archive {p.name}?</AlertDialogTitle><AlertDialogDescription>The style will be hidden. Existing orders and images stay available.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>void archive(p)}>Archive product</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></article>)}</div>
      </>}</TabsContent>
      <TabsContent value="orders"><OrdersPanel/></TabsContent>
      <TabsContent value="inventory"><div className="orders-card"><h2>Low-stock dashboard</h2>{lowStock.map(p=><p key={p.id}><button onClick={()=>{setSelected(p);setTab("products");}}>{p.name}</button> — {SIZES.filter(size=>p.stock[size]<=p.lowStockThreshold).map(size=>size+": "+p.stock[size]).join(" · ")}</p>)}</div><InventoryHistory/></TabsContent>
      <TabsContent value="coupons"><CouponsPanel/></TabsContent>
      <TabsContent value="settings"><SettingsPanel/></TabsContent>
    </Tabs>}
  </main>;
}
