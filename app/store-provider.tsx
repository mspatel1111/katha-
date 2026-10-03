"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from "react";
import {useLocalValue,writeLocal,readLocal} from "@/lib/browser-store";
import {CART_KEY,parseCart,cartLines,changeCartSize} from "@/lib/cart";
import {DEFAULT_SETTINGS,shippingFor,type StoreSettings} from "@/lib/store-config";
import type {Product,Size} from "@/lib/catalog";
type StoreValue={
 products:Product[];settings:StoreSettings;cart:Record<string,number>;prices:Record<string,number>;
 ready:boolean;error:string;bagOpen:boolean;openBag:()=>void;closeBag:()=>void;restoreBagFocus:()=>void;
 refresh:()=>Promise<void>;change:(key:string,quantity:number)=>void;changeSize:(key:string,size:Size,product:Product)=>void;clear:()=>void;
};
const StoreContext=createContext<StoreValue|null>(null);
export function StoreProvider({children}:{children:ReactNode}){
 const cart=parseCart(useLocalValue(CART_KEY));
 const prices=useLocalValue("katha-cart-prices-v1") as Record<string,number>;
 const [products,setProducts]=useState<Product[]>([]);
 const [settings,setSettings]=useState(DEFAULT_SETTINGS);
 const [ready,setReady]=useState(false);const [error,setError]=useState("");
 const [bagOpen,setBagOpen]=useState(false);
 const bagTrigger=useRef<HTMLElement|null>(null);
 const rememberBagTrigger=()=>{bagTrigger.current=document.activeElement instanceof HTMLElement?document.activeElement:null;};
 const refresh=useCallback(async()=>{
  let raw:unknown={};try{raw=JSON.parse(readLocal(CART_KEY));}catch{/* Ignore corrupt device-local state. */}
  const current=parseCart(raw);
  const ids=Object.keys(current).map(key=>key.split("-")[0]).join(",");
  const [catalog,config]=await Promise.all([fetch("/api/products?limit=48"+(ids?"&ids="+ids:""),{cache:"no-store"}),fetch("/api/settings",{cache:"no-store"})]);
  if(!catalog.ok||!config.ok)throw new Error("We could not refresh your bag. Please try again.");
  const [data,store]=await Promise.all([catalog.json<{products:Product[]}>(),config.json<{settings:StoreSettings}>()]);
  setProducts(data.products);setSettings(store.settings);setReady(true);setError("");
 },[]);
 useEffect(()=>{
  let active=true;
  const sync=()=>{void refresh().catch(error=>{if(active){setError(error.message);setReady(false);}});};
  const open=()=>{rememberBagTrigger();setBagOpen(true);sync();};
  sync();
  window.addEventListener("katha-open-bag",open);
  window.addEventListener("focus",sync);
  window.addEventListener("katha-settings-updated",sync);
  return()=>{active=false;window.removeEventListener("katha-open-bag",open);window.removeEventListener("focus",sync);window.removeEventListener("katha-settings-updated",sync);};
 },[refresh]);
 const change=(key:string,quantity:number)=>{
  const next={...cart};
  if(quantity>0){const line=cartLines(cart,products).find(line=>line.key===key);next[key]=Math.min(10,Math.max(1,quantity),line?.stock??10);}
  else delete next[key];
  if(!next[key])delete next[key];writeLocal(CART_KEY,next);
 };
 const value:StoreValue={products,settings,cart,prices,ready,error,bagOpen,refresh,
  openBag:()=>{rememberBagTrigger();setBagOpen(true);void refresh().catch(error=>setError(error.message));},closeBag:()=>setBagOpen(false),
  restoreBagFocus:()=>{if(bagTrigger.current?.isConnected)bagTrigger.current.focus({preventScroll:true});},
  change,changeSize:(key,size,p)=>writeLocal(CART_KEY,changeCartSize(cart,key,size,p)),
  clear:()=>{writeLocal(CART_KEY,{});writeLocal("katha-cart-prices-v1",{});},
 };
 return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore(){const store=useContext(StoreContext);if(!store)throw new Error("Store context unavailable.");return store;}
export function useBag(){
 const store=useStore();const lines=cartLines(store.cart,store.products,store.prices);
 const subtotal=lines.reduce((sum,line)=>sum+(line.available?(line.product?.price??0)*line.quantity:0),0);
 const shipping=shippingFor(subtotal,store.settings);
 return {...store,lines,subtotal,shipping,total:subtotal+shipping,count:Object.values(store.cart).reduce((a,b)=>a+b,0),invalid:!store.ready||lines.some(line=>!line.available||line.stockChanged)};
}
