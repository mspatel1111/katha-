"use client";
import {useEffect,useState,type FormEvent} from "react";
import {Button} from "@/components/ui/button";
import {DEFAULT_SETTINGS,type StoreSettings} from "@/lib/store-config";
import {CATEGORIES} from "@/lib/catalog";
import type {Coupon} from "@/lib/commerce";
async function loadSettings(){const r=await fetch("/api/admin/settings",{cache:"no-store"});if(!r.ok)throw new Error("Could not load settings.");return r.json<{settings:StoreSettings&{revision:number}}>();}
export function SettingsPanel(){
 const [draft,setDraft]=useState<StoreSettings>(DEFAULT_SETTINGS);const [revision,setRevision]=useState(0);
 const [ready,setReady]=useState(false);const [message,setMessage]=useState("");const [saving,setSaving]=useState(false);
 useEffect(()=>{loadSettings().then(data=>{setDraft(data.settings);setRevision(data.settings.revision);setReady(true);}).catch(error=>setMessage(error.message));},[]);
 const save=async(event:FormEvent)=>{
  event.preventDefault();setSaving(true);
  try{const response=await fetch("/api/admin/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({settings:draft,revision})});const data=await response.json<{error?:string}>();if(!response.ok)throw new Error(data.error);const next=await loadSettings();setRevision(next.settings.revision);setMessage("Store settings saved.");window.dispatchEvent(new Event("katha-settings-updated"));}
  catch(error){setMessage(error instanceof Error?error.message:"Could not save.");}finally{setSaving(false);}
 };
 const fields=[["storeName","Store name"],["phone","Phone"],["whatsapp","WhatsApp number (country code + digits)"],["contactEmail","Contact email (optional)"],["mapsUrl","Google Maps URL"],["instagramUrl","Instagram URL"],["timings","Store timings"],["announcement","Announcement"],["heroTitle","Homepage hero title"],["heroDescription","Homepage hero description"]] as const;
 return <form className="admin-editor" onSubmit={save}><h2>Store settings</h2><div className="form-grid">
 {fields.map(([key,label])=><label key={key}>{label}<input value={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}
 <label className="full">Store address<textarea rows={3} value={draft.address} onChange={e=>setDraft({...draft,address:e.target.value})}/></label><label className="full">About the shop<textarea rows={4} value={draft.aboutShop} onChange={e=>setDraft({...draft,aboutShop:e.target.value})}/></label>
 <label>Shipping charge (₹)<input type="number" min={0} value={draft.shippingCharge} onChange={e=>setDraft({...draft,shippingCharge:Number(e.target.value)})}/></label><label>Free-shipping threshold (₹, 0 = all orders)<input type="number" min={0} value={draft.freeShippingThreshold} onChange={e=>setDraft({...draft,freeShippingThreshold:Number(e.target.value)})}/></label>
 <label><input type="checkbox" checked={draft.codEnabled} onChange={e=>setDraft({...draft,codEnabled:e.target.checked})}/>Cash on delivery enabled</label></div>
 <h3>Policies</h3>{draft.policies.map((policy,index)=><label className="block-field" key={policy.id}>{policy.title}<textarea rows={5} value={policy.copy} onChange={e=>setDraft({...draft,policies:draft.policies.map((p,i)=>i===index?{...p,copy:e.target.value}:p)})}/></label>)}
 <h3>FAQ</h3>{draft.faq.map((faq,index)=><div className="form-grid" key={index}><label>Question<input value={faq.question} onChange={e=>setDraft({...draft,faq:draft.faq.map((p,i)=>i===index?{...p,question:e.target.value}:p)})}/></label><label>Answer<textarea value={faq.answer} onChange={e=>setDraft({...draft,faq:draft.faq.map((p,i)=>i===index?{...p,answer:e.target.value}:p)})}/></label></div>)}
 <Button type="button" variant="outline" onClick={()=>setDraft({...draft,faq:[...draft.faq,{question:"New question",answer:"Add an answer."}]})}>Add FAQ</Button>
 {message&&<p role="status">{message}</p>}<Button disabled={!ready||saving}>{saving?"Saving…":"Save settings"}</Button></form>;
}
const empty:Coupon={id:0,code:"",kind:"percentage",value:10,minimumAmount:0,maximumDiscount:null,startAt:null,endAt:null,usageLimit:null,usageCount:0,active:true,productIds:[],categories:[],revision:0};
export function CouponsPanel(){
 const [coupons,setCoupons]=useState<Coupon[]>([]);const [draft,setDraft]=useState<Coupon>(empty);const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 useEffect(()=>{fetch("/api/admin/coupons").then(r=>r.json<{coupons:Coupon[]}>()).then(data=>setCoupons(data.coupons??[])).catch(()=>setMessage("Could not load coupons."));},[]);
 const save=async(event:FormEvent)=>{
 event.preventDefault();setBusy(true);
 try{const response=await fetch("/api/admin/coupons",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(draft)});const data=await response.json<{error?:string}>();if(!response.ok)throw new Error(data.error);const list=await fetch("/api/admin/coupons").then(r=>r.json<{coupons:Coupon[]}>());setCoupons(list.coupons);setDraft(empty);setMessage("Coupon saved.");}
 catch(error){setMessage(error instanceof Error?error.message:"Could not save.");}finally{setBusy(false);}
 };
 const dateValue=(value:string|null)=>value?new Date(Date.parse(value)-new Date(value).getTimezoneOffset()*60000).toISOString().slice(0,16):"";
 return <div className="admin-editor"><h2>Coupons</h2><div className="admin-toolbar">{coupons.map(c=><Button key={c.id} variant="outline" onClick={()=>setDraft(c)}>{c.code} ({c.active?"active":"inactive"}, {c.usageCount} used)</Button>)}<Button onClick={()=>setDraft(empty)}>New coupon</Button></div>
 <form onSubmit={save}><div className="form-grid"><label>Coupon code<input required value={draft.code} onChange={e=>setDraft({...draft,code:e.target.value.toUpperCase()})}/></label><label>Discount type<select value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value as Coupon["kind"]})}><option value="percentage">Percentage</option><option value="fixed">Fixed amount (₹)</option></select></label>
 {([["value","Discount value"],["minimumAmount","Minimum order amount"],["maximumDiscount","Maximum discount (optional)"],["usageLimit","Usage limit (optional)"]] as const).map(([key,label])=><label key={key}>{label}<input type="number" min={key==="minimumAmount"?0:1} value={draft[key]??""} onChange={e=>setDraft({...draft,[key]:e.target.value?Number(e.target.value):null})}/></label>)}
 {([["startAt","Starts"],["endAt","Expires"]] as const).map(([key,label])=><label key={key}>{label}<input type="datetime-local" value={dateValue(draft[key])} onChange={e=>setDraft({...draft,[key]:e.target.value?new Date(e.target.value).toISOString():null})}/></label>)}
 <label className="full">Allowed product IDs (optional, comma-separated)<input value={draft.productIds.join(",")} onChange={e=>setDraft({...draft,productIds:e.target.value.split(",").filter(v=>v.trim()).map(Number)})}/></label>
 <fieldset className="full"><legend>Allowed categories (none = all)</legend>{CATEGORIES.map(c=><label className="checkbox-inline" key={c}><input type="checkbox" checked={draft.categories.includes(c)} onChange={e=>setDraft({...draft,categories:e.target.checked?[...draft.categories,c]:draft.categories.filter(v=>v!==c)})}/>{c}</label>)}</fieldset>
 <label><input type="checkbox" checked={draft.active} onChange={e=>setDraft({...draft,active:e.target.checked})}/>Active</label></div>{message&&<p role="status">{message}</p>}<Button disabled={busy}>{busy?"Saving…":"Save coupon"}</Button></form></div>;
}
