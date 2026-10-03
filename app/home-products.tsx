import {ProductGrid} from "./product-grid";
import type {Product} from "@/lib/catalog";
export function HomeProducts({products}:{products:Product[]}){return products.length?<ProductGrid products={products}/>:<p>New styles are coming soon.</p>;}
