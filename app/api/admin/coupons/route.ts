import {NextResponse} from "next/server";
import {getAdmin,auditAdmin} from "@/lib/admin-auth";
import {getD1} from "@/lib/catalog-db";
import {couponFromRow} from "@/lib/quote-db";
import {couponSchema} from "@/lib/settings-validation";
export const dynamic="force-dynamic";
export async function GET(){
 if(!(await getAdmin()))return NextResponse.json({error:"Unauthorized"},{status:401});
 const data=await getD1().prepare("SELECT * FROM coupons ORDER BY id DESC").all<Record<string,unknown>>();
 return NextResponse.json({coupons:data.results.map(couponFromRow)},{headers:{"Cache-Control":"no-store"}});
}
export async function PUT(request:Request){
 const admin=await getAdmin(request);if(!admin)return NextResponse.json({error:"Unauthorized"},{status:401});
 const parsed=couponSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0].message},{status:400});
 const p=parsed.data;const values=[p.code,p.kind,p.value,p.minimumAmount,p.maximumDiscount,p.startAt,p.endAt,p.usageLimit,Number(p.active),JSON.stringify(p.productIds),JSON.stringify(p.categories)];
 const columns=["code","kind","value","minimum_amount","maximum_discount","start_at","end_at","usage_limit","active","product_ids","categories"];
 try{
 const sql=p.id?"UPDATE coupons SET "+columns.map(c=>c+"=?").join(",")+",revision=revision+1 WHERE id=? AND revision=? RETURNING id":"INSERT INTO coupons("+columns.join(",")+") VALUES("+columns.map(()=>"?").join(",")+") RETURNING id";
 const result=await getD1().prepare(sql).bind(...values,...(p.id?[p.id,p.revision]:[])).first<{id:number}>();
 if(!result)throw new Error("Coupon changed. Refresh before saving.");
 await auditAdmin(admin,"coupon_save",String(result.id));
 return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return NextResponse.json({error:error instanceof Error&&/UNIQUE/.test(error.message)?"Coupon code already exists.":"Could not save coupon. Refresh and retry."},{status:409});}
}
