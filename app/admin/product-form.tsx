"use client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ResponsiveImage } from "@/app/responsive-image";
import { CATEGORIES, COLORS, SIZES, slugify, type Product } from "@/lib/catalog";
import { productSchema } from "@/lib/product-validation";
import {optimizedImageForm} from "@/lib/client-image";
const textFields = [["sku","SKU / product code"],["slug","SEO slug"],["fabric","Fabric"],["work","Work / embroidery"],["washCare","Wash care"],["occasion","Occasion"],["fit","Fit"],["length","Product length"],["dispatchTime","Dispatch time"],["label","Label"]] as const;
export function ProductForm({ product, onSaved, onCancel }: { product: Product; onSaved: () => Promise<void>; onCancel: () => void }) {
  const [draft,setDraft] = useState<Product>({ ...product, images: product.images.map(image=>({...image})) });
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const patch = (update: Partial<Product>) => setDraft(current=>({...current,...update}));
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = productSchema.safeParse(draft);
    if (!parsed.success) { setMessage(parsed.error.issues[0].message); return; }
    setBusy(true); setMessage("");
    try {
      const response=await fetch("/api/admin/catalog",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(draft)});
      const data=await response.json<{error?:string;url?:string}>();
      if(!response.ok) throw new Error(data.error ?? "Could not save product.");
      await onSaved(); setMessage("Product saved.");
    } catch(error){setMessage(error instanceof Error?error.message:"Could not save product.");}
    finally {setBusy(false);}
  };
  const upload = async (list: FileList | null) => {
    if(!list?.length) return;
    if(draft.images.length + list.length > 12) { setMessage("Use up to 12 images per product."); return; }
    setBusy(true); setMessage("");
    try {
      const images=[...draft.images];
      for(const file of Array.from(list)){
        const form=await optimizedImageForm(file);
        const response=await fetch("/api/admin/upload",{method:"POST",body:form});
        const data=await response.json<{error?:string;url?:string}>();
        if(!response.ok || !data.url) throw new Error(data.error??"Image upload failed.");
        images.push({url:data.url,alt:draft.name,displayOrder:images.length,primary:images.length===0});
      }
      patch({images,image:images.find(image=>image.primary)?.url??draft.image});
      setMessage("Images uploaded. Save the product to publish this gallery.");
    } catch(error){setMessage(error instanceof Error?error.message:"Upload failed.");}
    finally{setBusy(false);}
  };
  const reorder = (index: number,direction: number) => {
    const next=[...draft.images]; const target=index+direction;
    if(target<0||target>=next.length)return;
    [next[index],next[target]]=[next[target],next[index]];
    patch({images:next.map((image,order)=>({...image,displayOrder:order}))});
  };
  return <form className="admin-editor" onSubmit={save}>
    <div className="admin-editor-heading"><h2>{draft.id?"Edit product":"Add product"}</h2><Button type="button" variant="outline" onClick={onCancel}>Close</Button></div>
    <div className="form-grid">
      <label className="full">Product name<Input required minLength={3} value={draft.name} onChange={e=>patch({name:e.target.value})} onBlur={()=>{if(!draft.slug)patch({slug:slugify(draft.name)});}}/></label>
      <label>Selling price (₹)<Input type="number" min={draft.active?1:0} required value={draft.price} onChange={e=>patch({price:Number(e.target.value)})}/></label>
      <label>Compare / MRP price (₹)<Input type="number" min={draft.price} value={draft.oldPrice??""} onChange={e=>patch({oldPrice:e.target.value?Number(e.target.value):undefined})}/></label>
      <label>Category<NativeSelect value={draft.category} onChange={e=>patch({category:e.target.value as Product["category"]})}>{CATEGORIES.map(value=><NativeSelectOption key={value}>{value}</NativeSelectOption>)}</NativeSelect></label>
      <label>Colour<NativeSelect value={draft.color} onChange={e=>patch({color:e.target.value as Product["color"]})}>{COLORS.map(value=><NativeSelectOption key={value}>{value}</NativeSelectOption>)}</NativeSelect></label>
      {textFields.map(([key,label])=><label key={key}>{label}<Input value={draft[key]??""} required={key==="sku"||key==="slug"} onChange={e=>patch({[key]:e.target.value})}/>{key==="slug"&&<Button type="button" variant="ghost" onClick={()=>patch({slug:slugify(draft.name)})}>Generate from name</Button>}</label>)}
      <label className="full">Full product description<textarea rows={5} value={draft.description} onChange={e=>patch({description:e.target.value})}/></label>
      <label>Display order<Input type="number" min={0} value={draft.displayOrder} onChange={e=>patch({displayOrder:Number(e.target.value)})}/></label>
      <label>Low-stock threshold<Input type="number" min={0} value={draft.lowStockThreshold} onChange={e=>patch({lowStockThreshold:Number(e.target.value)})}/></label>
    </div>
    <div className="admin-flags">{([["active","Visible"],["featured","Featured"],["newArrival","New arrival"],["bestseller","Bestseller"]] as const).map(([key,label])=><label key={key} htmlFor={"product-"+key}><Switch id={"product-"+key} checked={draft[key]} onCheckedChange={checked=>patch({[key]:checked,...(key==="active"&&checked?{archived:false}:{})})}/>{label}</label>)}</div>
    <h3>Size-wise inventory</h3><div className="stock-grid">{SIZES.map(size=><label key={size}>{size}<Input type="number" min={0} max={9999} value={draft.stock[size]} onChange={e=>patch({stock:{...draft.stock,[size]:Number(e.target.value)}})}/></label>)}</div>
    <h3>Product images</h3><label className="upload-control">Upload images<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void upload(e.target.files);e.target.value="";}}/></label>
    <div className="admin-gallery">{draft.images.map((image,index)=><article key={image.url}>
      <ResponsiveImage src={image.url} alt={image.alt||draft.name} sizes="150px" loading="lazy"/>
      <label>Alt text<Input value={image.alt} onChange={e=>patch({images:draft.images.map((entry,i)=>i===index?{...entry,alt:e.target.value}:entry)})}/></label>
      <label><input type="radio" name="primary" checked={image.primary} onChange={()=>patch({image:image.url,images:draft.images.map((entry,i)=>({...entry,primary:i===index}))})}/>Primary image</label>
      <div className="admin-image-actions"><Button type="button" variant="outline" disabled={!index} onClick={()=>reorder(index,-1)} aria-label="Move image earlier">↑</Button><Button type="button" variant="outline" disabled={index===draft.images.length-1} onClick={()=>reorder(index,1)} aria-label="Move image later">↓</Button><Button type="button" variant="outline" onClick={()=>{
        const images=draft.images.filter((_,i)=>i!==index);
        if(image.primary&&images.length)images[0]={...images[0],primary:true};
        patch({images,image:images.find(entry=>entry.primary)?.url??"/images/katha-blue-set-4k.jpg"});
      }}>Remove</Button></div>
    </article>)}</div>
    {message&&<p role="status" className="admin-message">{message}</p>}
    <Button disabled={busy} type="submit">{busy?"Saving…":"Save product"}</Button>
  </form>;
}
