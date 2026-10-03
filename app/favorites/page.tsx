"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {StoreHeader} from "@/app/store-header";
import {StoreFooter} from "@/app/store-footer";
import {ProductGrid} from "@/app/product-grid";
import {favoriteIds,FAVORITES_KEY} from "@/app/favorites";
import {useLocalValue} from "@/lib/browser-store";
import type {Product} from "@/lib/catalog";
export default function Favorites(){const ids=favoriteIds(useLocalValue(FAVORITES_KEY,true));const key=ids.join(",");const [products,setProducts]=useState<Product[]>([]);const [error,setError]=useState("");useEffect(()=>{if(!key)return;const abort=new AbortController();async function load(){try{const batches=key.split(",");const all:Product[]=[];for(let start=0;start<batches.length;start+=20){const r=await fetch("/api/products?ids="+batches.slice(start,start+20).join(","),{cache:"no-store",signal:abort.signal});if(!r.ok)throw new Error("Could not load favorites. Please retry.");all.push(...(await r.json<{products:Product[]}>()).products);}setProducts(all.filter(p=>p.active&&!p.archived));setError("");}catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:"Could not load favorites.");}}void load();return()=>abort.abort();},[key]);const shown=products.filter(p=>ids.includes(p.id));return <main className="favorites-page"><StoreHeader/><header className="favorites-hero"><p className="eyebrow">Your saved edit</p><h1>Favorites.</h1><p>Keep the KATHA pieces you love in one place.</p></header>{error&&<p role="alert">{error}</p>}{shown.length?<section className="favorites-grid"><ProductGrid products={shown}/></section>:<section className="favorites-empty"><h2>{ids.length?"Your saved styles are loading or unavailable.":"No favorites yet"}</h2><p>Tap the heart on any style to save it here.</p><Link className="dark-button" href="/shop">Explore the collection</Link></section>}<StoreFooter/></main>;}
