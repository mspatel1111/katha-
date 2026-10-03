export const POLICY_DEFAULTS = [
 {id:"privacy",title:"Privacy policy",copy:"We use your contact and delivery details to process orders and provide customer support. KATHA does not store card or UPI credentials. Contact the store to request correction or deletion of personal information, subject to required order records."},
 {id:"cancellation",title:"Cancellation and refund",copy:"Contact KATHA before packing or dispatch to request cancellation. Approved refunds for prepaid orders are returned through the original payment method. COD orders have no prepaid amount to refund."},
 {id:"terms",title:"Terms and conditions",copy:"Prices are in Indian rupees and include applicable taxes unless stated otherwise. Orders depend on stock and serviceable delivery locations. Screen colours may differ from actual fabric. Please confirm sizing and product details before purchase."},
 {id:"shipping",title:"Shipping and delivery",copy:"We deliver within India. Shipping charges and free-shipping eligibility are shown before placing your order. Dispatch time is shown for each product. Delivery time depends on your location and courier service."},
 {id:"returns",title:"No return — no exchange",copy:"Please check measurements before ordering. Our current store policy is no return or exchange for change of mind or sizing. For a wrong, missing or damaged item, contact KATHA promptly with your order ID and photographs. This policy does not limit rights available under applicable law."},
];
export const DEFAULT_SETTINGS = {
 storeName:"KATHA Ethnic Wear",phone:"+917984662517",whatsapp:"917984662517",
 address:"Shop Nos. 09–10–11–12–13–14, Shivaay Complex, Ranasan Road, opposite CNG Pump, Ranasan, Gujarat 383305",
 mapsUrl:"https://maps.app.goo.gl/ct9v8B4hbjh3LLw79",instagramUrl:"https://www.instagram.com/katha_ethnic_wear/",
 timings:"Contact our team for current store timings.",announcement:"Complimentary shipping on orders of ₹2,999 and above",
 shippingCharge:99,freeShippingThreshold:2999,codEnabled:true,
 heroTitle:"Every occasion deserves ethnic perfection.",heroDescription:"Simple, elegant Indian silhouettes selected to make every celebration feel entirely your own.",
 contactEmail:"",aboutShop:"KATHA brings together thoughtfully selected Indian silhouettes for everyday elegance and special celebrations. Discover kurtis, co-ord sets, sarees, festive wear and dupattas chosen for comfort and character.",
 policies:POLICY_DEFAULTS,
 faq:[{question:"How do I choose my size?",answer:"Use the size guide and contact KATHA for garment measurements. Fit varies between styles."},{question:"Can I pay on delivery?",answer:"Cash on delivery is available when enabled at checkout."},{question:"How do I track an order?",answer:"Use your order ID and checkout mobile number on the Track Order page."}],
};
export type StoreSettings = typeof DEFAULT_SETTINGS;
export function shippingFor(subtotal:number,settings:Pick<StoreSettings,"shippingCharge"|"freeShippingThreshold">){
 return subtotal>0&&(settings.freeShippingThreshold===0||subtotal>=settings.freeShippingThreshold)?0:subtotal>0?settings.shippingCharge:0;
}
