import {NextResponse} from "next/server";
import {quoteOrder} from "@/lib/quote-db";
import {applyRateLimit} from "@/lib/rate-limit";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 const limit=await applyRateLimit(request,"quote",30);
 if(!limit.allowed)return NextResponse.json({error:"Please wait a minute before trying again."},{status:429});
 if(Number(request.headers.get("content-length")??0)>16384)return NextResponse.json({error:"Request too large."},{status:413});
 try{
  const body=await request.json<{items?:unknown;couponCode?:unknown}>();const q=await quoteOrder(body.items,String(body.couponCode??"").slice(0,30));
  return NextResponse.json({subtotal:q.subtotal,shipping:q.shipping,discount:q.discount,total:q.total,couponCode:q.coupon?.code??null},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not calculate your order."},{status:400});}
}
