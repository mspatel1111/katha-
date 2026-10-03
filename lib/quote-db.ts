import {getCatalogPage,getD1} from "./catalog-db";
import {getSettings} from "./settings-db";
import {calculateTotals,validateLines,itemSchema,type Coupon} from "./commerce";
export function couponFromRow(row:Record<string,unknown>):Coupon{
 return {id:Number(row.id),code:String(row.code),kind:row.kind as Coupon["kind"],value:Number(row.value),
 minimumAmount:Number(row.minimum_amount),maximumDiscount:row.maximum_discount===null?null:Number(row.maximum_discount),
 startAt:row.start_at as string|null,endAt:row.end_at as string|null,usageLimit:row.usage_limit===null?null:Number(row.usage_limit),
 usageCount:Number(row.usage_count),active:row.active===1,productIds:JSON.parse(String(row.product_ids)),categories:JSON.parse(String(row.categories)),revision:Number(row.revision)};
}
export async function quoteOrder(items:unknown,couponCode=""){
 const parsed=itemSchema.parse(items);const {products}=await getCatalogPage(new URLSearchParams({ids:[...new Set(parsed.map(item=>item.productId))].join(",")}));
 const lines=validateLines(parsed,products);const settings=await getSettings();
 let coupon:Coupon|null=null;
 if(couponCode){
  const row=await getD1().prepare("SELECT * FROM coupons WHERE code=?").bind(couponCode.trim().toUpperCase()).first<Record<string,unknown>>();
  if(!row)throw new Error("Coupon code was not found.");coupon=couponFromRow(row);
 }
 return {lines,settings,coupon,...calculateTotals(lines,settings,coupon)};
}
