import {SizeTable} from "@/app/size-guide";import {StoreHeader} from "@/app/store-header";import {StoreFooter} from "@/app/store-footer";import {pageMetadata} from "@/lib/seo";
export const metadata=pageMetadata("Size guide | KATHA","General body measurements for S, M, L, XL, XXL and XXXL.","/size-guide");
export default function SizeGuide(){return <main><StoreHeader/><section className="customer-content"><h1>Size guide</h1><SizeTable/></section><StoreFooter/></main>;}
