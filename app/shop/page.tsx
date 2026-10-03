import {StoreHeader} from "@/app/store-header";
import {StoreFooter} from "@/app/store-footer";
import {getCatalogPage} from "@/lib/catalog-db";
import {getSettings} from "@/lib/settings-db";
import {ShopClient} from "./shop-client";
import {pageMetadata} from "@/lib/seo";
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
export const dynamic="force-dynamic";
export async function generateMetadata({searchParams}:Props){const query=await searchParams;const category=typeof query.category==="string"?query.category:"Shop all";const settings=await getSettings();return pageMetadata(category+" | "+settings.storeName,"Explore "+category.toLowerCase()+" from "+settings.storeName+". Sizes S to XXXL.","/shop"+(category!=="Shop all"?"?category="+encodeURIComponent(category):""));}
export default async function Shop({searchParams}:Props){const raw=await searchParams;const search=new URLSearchParams(Object.entries(raw).filter(([,v])=>typeof v==="string") as [string,string][]);const initial=await getCatalogPage(search);return <main className="shop-page"><StoreHeader/><section className="shop-heading"><p className="eyebrow">KATHA Collection</p><h1>{search.get("category")||"Shop all"}</h1><p>Modern ethnic pieces, available from S to XXXL.</p></section><ShopClient key={search.toString()} initial={initial} initialQuery={search.toString()}/><StoreFooter/></main>;}
