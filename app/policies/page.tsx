import Link from "next/link";
import {getSettings} from "@/lib/settings-db";
import {StoreHeader} from "@/app/store-header";
import {StoreFooter} from "@/app/store-footer";
import {pageMetadata} from "@/lib/seo";
export const dynamic="force-dynamic";
export const metadata=pageMetadata("Store policies | KATHA","Shipping, cancellation, privacy and store policies.","/policies");
export default async function Policies(){const s=await getSettings();return <main className="policies-page"><StoreHeader/><header className="policies-hero"><p className="eyebrow">Customer care</p><h1>Store policies.</h1><p>Clear information for shopping and delivery.</p></header><div className="policies-layout"><nav aria-label="Policy sections">{s.policies.map(p=><Link key={p.id} href={"#"+p.id}>{p.title}</Link>)}</nav><div className="policy-sections">{s.policies.map((p,i)=><section key={p.id} id={p.id}><span>0{i+1}</span><div><h2>{p.title}</h2><p>{p.copy}</p></div></section>)}</div></div><section className="policy-help"><p>Need help with an order?</p><a href={"https://wa.me/"+s.whatsapp} target="_blank" rel="noreferrer">Chat with the store team</a></section><StoreFooter/></main>;}
