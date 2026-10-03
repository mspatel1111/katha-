import {NextResponse} from "next/server";
import {getCatalogPage} from "@/lib/catalog-db";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{const search=new URL(request.url).searchParams;const result=await getCatalogPage(search);
  return NextResponse.json(result,{headers:{"Cache-Control":search.has("ids")?"no-store":"public, max-age=0, s-maxage=15"}});
 }catch(error){console.error("catalog_unavailable",error);return NextResponse.json({error:"The collection could not load. Please retry."},{status:503,headers:{"Cache-Control":"no-store"}});}
}
