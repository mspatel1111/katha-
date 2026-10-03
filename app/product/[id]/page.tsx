import Link from "next/link";
import type { Metadata } from "next";
import { notFound,permanentRedirect } from "next/navigation";
import { StoreHeader } from "@/app/store-header";
import { StoreFooter } from "@/app/store-footer";
import { ResponsiveImage } from "@/app/responsive-image";
import { getCatalogPage,getProduct } from "@/lib/catalog-db";
import { money,productHref } from "@/lib/catalog";
import { ProductDetails,RecentlyViewed } from "../product-details";
import {getSettings} from "@/lib/settings-db";
import {pageMetadata,jsonLd} from "@/lib/seo";
export const dynamic="force-dynamic";
const origin="https://katha-ethnic-wear.yashpatel9724945.chatgpt.site";
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
 const {id}=await params;const product=await getProduct(id);
 if(!product)return {title:"Product not found | KATHA",robots:{index:false}};
 return pageMetadata(product.name+" | KATHA Ethnic Wear",product.description.slice(0,160)||"Shop "+product.name+" at KATHA.",productHref(product),product.image.replace("-4k.jpg","-1200w.webp").replace("-master.webp","-1200w.webp"));
}
export default async function ProductPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const product=await getProduct(id);
 if(!product)notFound();
 if(String(product.id)===id&&product.slug)permanentRedirect(productHref(product));
 const {products}=await getCatalogPage(new URLSearchParams({category:product.category,limit:"5"}));
 const settings=await getSettings();
 return <main className="product-page"><StoreHeader/><nav className="product-back" aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href={"/shop?category="+encodeURIComponent(product.category)}>{product.category}</Link> / <span>{product.name}</span></nav>
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd([{"@context":"https://schema.org","@type":"Product",name:product.name,sku:product.sku,description:product.description,color:product.color,category:product.category,image:product.images.map(image=>origin+image.url.replace("-4k.jpg","-1200w.webp").replace("-master.webp","-1200w.webp")),offers:{"@type":"Offer",url:origin+productHref(product),priceCurrency:"INR",price:product.price,availability:Object.values(product.stock).some(value=>value>0)?"https://schema.org/InStock":"https://schema.org/OutOfStock"}},{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:origin},{"@type":"ListItem",position:2,name:product.category,item:origin+"/shop?category="+encodeURIComponent(product.category)},{"@type":"ListItem",position:3,name:product.name,item:origin+productHref(product)}]}])}}/>
 <ProductDetails product={product} whatsapp={settings.whatsapp}/>
 {products.some(p=>p.id!==product.id)&&<section className="related-products"><h2>You may also like</h2><div className="shop-grid">{products.filter(p=>p.id!==product.id).slice(0,4).map(p=><Link key={p.id} href={productHref(p)}><ResponsiveImage src={p.image} alt={p.name} loading="lazy"/><h3>{p.name}</h3><p>{money(p.price)}</p></Link>)}</div></section>}<RecentlyViewed currentId={product.id}/><StoreFooter/></main>;
}
