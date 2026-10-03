import {z} from "zod";
import {SIZES,type Product,type Size} from "./catalog";
import {shippingFor,type StoreSettings} from "./store-config";
export const INDIAN_STATES=["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"] as const;
export const itemSchema=z.array(z.object({productId:z.number().int().positive(),size:z.enum(SIZES),quantity:z.number().int().min(1).max(10)})).min(1).max(20);
export const customerSchema=z.object({
 name:z.string().trim().min(2).max(100),email:z.string().email().max(160),
 phone:z.string().transform(value=>value.replace(/\D/g,"").replace(/^91(?=\d{10}$)/,"")).refine(value=>/^[6-9]\d{9}$/.test(value),"Enter a valid Indian mobile number."),
 address:z.string().trim().min(8).max(250),landmark:z.string().trim().max(150).default(""),
 city:z.string().trim().min(2).max(80),state:z.enum(INDIAN_STATES),pincode:z.string().regex(/^[1-9]\d{5}$/,"Enter a valid 6-digit Indian pincode."),
});
export type Coupon={id:number;code:string;kind:"fixed"|"percentage";value:number;minimumAmount:number;maximumDiscount:number|null;startAt:string|null;endAt:string|null;usageLimit:number|null;usageCount:number;active:boolean;productIds:number[];categories:string[];revision:number};
export type ValidatedLine={product:Product;size:Size;quantity:number};
export function validateLines(items:z.infer<typeof itemSchema>,products:Product[]):ValidatedLine[]{
 const quantities=new Map<string,number>();
 for(const item of items){const key=item.productId+"-"+item.size;quantities.set(key,(quantities.get(key)??0)+item.quantity);}
 return [...quantities].map(([key,quantity])=>{
  const[id,size]=key.split("-");const product=products.find(p=>p.id===Number(id));
  if(!product||!product.active||product.archived||quantity>10||product.stock[size as Size]<quantity)throw new Error("A selected style or size is unavailable. Refresh your bag.");
  return {product,size:size as Size,quantity};
 });
}
export function calculateTotals(lines:ValidatedLine[],settings:StoreSettings,coupon:Coupon|null,now=Date.now()){
 const subtotal=lines.reduce((sum,line)=>sum+line.product.price*line.quantity,0);
 let discount=0;
 if(coupon){
  if(!coupon.active)throw new Error("This coupon is inactive.");
  if(coupon.startAt&&Date.parse(coupon.startAt)>now)throw new Error("This coupon has not started yet.");
  if(coupon.endAt&&Date.parse(coupon.endAt)<=now)throw new Error("This coupon has expired.");
  if(coupon.usageLimit!==null&&coupon.usageCount>=coupon.usageLimit)throw new Error("This coupon has reached its usage limit.");
  if(subtotal<coupon.minimumAmount)throw new Error("This coupon requires an order of ₹"+coupon.minimumAmount+" or more.");
  const eligible=lines.filter(line=>(!coupon.productIds.length||coupon.productIds.includes(line.product.id))&&(!coupon.categories.length||coupon.categories.includes(line.product.category))).reduce((sum,line)=>sum+line.product.price*line.quantity,0);
  if(!eligible)throw new Error("This coupon does not apply to the styles in your bag.");
  discount=Math.min(eligible,coupon.kind==="percentage"?Math.floor(eligible*coupon.value/100):coupon.value,coupon.maximumDiscount??Infinity);
 }
 // Free shipping qualifies against merchandise subtotal before coupon discount.
 const shipping=shippingFor(subtotal,settings);
 return {subtotal,shipping,discount,total:subtotal+shipping-discount};
}
