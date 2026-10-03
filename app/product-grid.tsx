import Link from "next/link";
import {FavoriteButton} from "./favorites";
import {ResponsiveImage} from "./responsive-image";
import {money,productHref,type Product} from "@/lib/catalog";
export function ProductGrid({products,className="product-grid"}:{products:Product[];className?:string}){
 return <div className={className}>{products.map(product=><article className="product-card" key={product.id}><div className="product-image-wrap"><Link href={productHref(product)}><ResponsiveImage src={product.image} alt={product.images.find(image=>image.primary)?.alt||product.name} className="product-image" loading="lazy" sizes="(max-width:680px) 48vw, (max-width:1024px) 32vw, 24vw"/></Link>{product.label&&<span className="product-label">{product.label}</span>}<FavoriteButton productId={product.id}/></div><div className="product-details"><Link href={productHref(product)}><h3>{product.name}</h3></Link><p className="shop-card-meta">{product.color} · {product.category}</p><div className="price-row"><span>{money(product.price)}</span>{product.oldPrice&&<del>{money(product.oldPrice)}</del>}</div><Link className="product-view" href={productHref(product)}>View piece</Link></div></article>)}</div>;
}
