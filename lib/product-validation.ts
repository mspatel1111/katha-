import { z } from "zod";
import { CATEGORIES, COLORS, SIZES } from "./catalog";
export const imageUrl = z.string().regex(/^\/(images\/[a-zA-Z0-9._-]+|api\/images\/products\/[a-zA-Z0-9._-]+)$/);
export const productSchema = z.object({
  id: z.number().int().min(0), revision: z.number().int().min(0).default(0),
  sku: z.string().trim().min(2).max(60).transform(value => value.toUpperCase()),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(3).max(120), price: z.number().int().min(0).max(1000000),
  oldPrice: z.number().int().positive().nullable().optional(), image: imageUrl,
  images: z.array(z.object({ id: z.number().optional(), url: imageUrl, alt: z.string().trim().max(200), displayOrder: z.number().int().min(0), primary: z.boolean() })).max(12),
  category: z.enum(CATEGORIES), color: z.enum(COLORS),
  fabric: z.string().max(200), description: z.string().max(5000), work: z.string().max(500),
  washCare: z.string().max(500), occasion: z.string().max(200), fit: z.string().max(200),
  length: z.string().max(100), dispatchTime: z.string().max(100), label: z.string().max(30).nullable().optional(),
  active: z.boolean(), archived: z.boolean(), featured: z.boolean(), newArrival: z.boolean(), bestseller: z.boolean(),
  displayOrder: z.number().int().min(0), lowStockThreshold: z.number().int().min(0).max(9999),
  stock: z.object(Object.fromEntries(SIZES.map(size => [size,z.number().int().min(0).max(9999)])) as Record<(typeof SIZES)[number],z.ZodNumber>),
  createdAt: z.string().default(""), updatedAt: z.string().default(""),
}).superRefine((p,ctx) => {
  if(p.active&&p.price<=0)ctx.addIssue({code:"custom",message:"Enter a selling price before making the product visible.",path:["price"]});
  if (p.oldPrice && p.oldPrice < p.price) ctx.addIssue({ code: "custom", message: "Compare price cannot be below selling price.", path: ["oldPrice"] });
  if (p.images.length && p.images.filter(image => image.primary).length !== 1) ctx.addIssue({ code: "custom", message: "Choose exactly one primary image.", path: ["images"] });
});
