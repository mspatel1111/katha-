import {z} from "zod";
const https=z.string().url().refine(value=>value.startsWith("https://"),"Use an HTTPS URL.");
export const settingsSchema=z.object({
 storeName:z.string().trim().min(2).max(100),phone:z.string().regex(/^\+?[0-9 ]{10,18}$/),whatsapp:z.string().regex(/^\d{10,15}$/),
 address:z.string().trim().min(10).max(500),mapsUrl:https,instagramUrl:https,timings:z.string().min(3).max(300),
 announcement:z.string().max(200),shippingCharge:z.number().int().min(0).max(5000),freeShippingThreshold:z.number().int().min(0).max(1000000),
 codEnabled:z.boolean(),heroTitle:z.string().min(3).max(150),heroDescription:z.string().max(500),
 contactEmail:z.union([z.literal(""),z.string().email()]),aboutShop:z.string().max(2000),
 policies:z.array(z.object({id:z.string().regex(/^[a-z-]+$/),title:z.string().min(3).max(100),copy:z.string().min(5).max(5000)})).min(5).max(12),
 faq:z.array(z.object({question:z.string().min(3).max(200),answer:z.string().min(3).max(1000)})).max(20),
});
export const couponSchema=z.object({
 id:z.number().int().min(0).default(0),code:z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).transform(v=>v.toUpperCase()),
 kind:z.enum(["fixed","percentage"]),value:z.number().int().positive(),minimumAmount:z.number().int().min(0),
 maximumDiscount:z.number().int().positive().nullable(),startAt:z.string().datetime().nullable(),endAt:z.string().datetime().nullable(),
 usageLimit:z.number().int().positive().nullable(),active:z.boolean(),productIds:z.array(z.number().int().positive()).max(100),categories:z.array(z.string()).max(10),revision:z.number().int().min(0).default(0),
}).superRefine((p,ctx)=>{
 if(p.kind==="percentage"&&p.value>100)ctx.addIssue({code:"custom",message:"Percentage must be at most 100.",path:["value"]});
 if(p.startAt&&p.endAt&&p.endAt<=p.startAt)ctx.addIssue({code:"custom",message:"End date must be after the start date.",path:["endAt"]});
});
