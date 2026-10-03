export const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;
export const CATEGORIES = ["Kurtis", "Sarees", "Co-ord Sets", "Festive Wear", "Dupattas"] as const;
export const COLORS = ["Blue", "Maroon", "Black", "Green", "Ivory", "Pink", "Mustard", "Violet", "Rust", "Unspecified"] as const;
export type Size = (typeof SIZES)[number];
export type Category = (typeof CATEGORIES)[number];
export type ProductColor = (typeof COLORS)[number];
export type ProductImage = { id?: number; url: string; alt: string; displayOrder: number; primary: boolean };
export type Product = {
  id: number; sku: string; slug: string; name: string; price: number; oldPrice?: number;
  image: string; images: ProductImage[]; category: Category; color: ProductColor;
  fabric: string; description: string; work: string; washCare: string; occasion: string;
  fit: string; length: string; dispatchTime: string; label?: string; active: boolean;
  featured: boolean; newArrival: boolean; bestseller: boolean; displayOrder: number;
  lowStockThreshold: number; archived: boolean; revision: number;
  createdAt: string; updatedAt: string; stock: Record<Size, number>;
};
export function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
export function blankProduct(id = 0): Product {
  return {
    id, sku: "", slug: "", name: "", price: 1999, image: "/images/katha-blue-set-4k.jpg", images: [],
    category: "Kurtis", color: "Unspecified", fabric: "", description: "", work: "", washCare: "",
    occasion: "", fit: "", length: "", dispatchTime: "2–4 working days", active: true,
    featured: false, newArrival: true, bestseller: false, displayOrder: 0, lowStockThreshold: 3,
    archived: false, revision: 0, createdAt: "", updatedAt: "",
    stock: Object.fromEntries(SIZES.map(size => [size, 0])) as Record<Size, number>,
  };
}
export const DEFAULT_PRODUCTS: Product[] = [
  { id: 1, name: "Neel Blue Ethnic Set", price: 2499, oldPrice: 2999, image: "/images/katha-blue-set-4k.jpg", category: "Co-ord Sets", color: "Blue", label: "New", units: 8 },
  { id: 2, name: "Meher Maroon Co-ord Set", price: 2899, image: "/images/katha-maroon-set-4k.jpg", category: "Festive Wear", color: "Maroon", label: "Bestseller", units: 6 },
  { id: 3, name: "Noor Black Embroidered Kurta", price: 2699, image: "/images/katha-black-kurta-4k.jpg", category: "Kurtis", color: "Black", units: 10 },
  { id: 4, name: "Saanjh Blue Saree", price: 3199, oldPrice: 3699, image: "/images/katha-blue-saree-4k.jpg", category: "Sarees", color: "Blue", units: 5 },
].map((item, index) => ({
  ...blankProduct(item.id), ...item, category: item.category as Category, color: item.color as ProductColor,
  sku: "KATHA-" + String(item.id).padStart(4, "0"), slug: slugify(item.name),
  description: item.name + " — a KATHA style selected for everyday elegance and celebrations. Contact our store for specific fabric and measurements before ordering.",
  featured: true, newArrival: item.label === "New", bestseller: item.label === "Bestseller", displayOrder: index,
  images: [{ url: item.image, alt: item.name, displayOrder: 0, primary: true }],
  stock: Object.fromEntries(SIZES.map(size => [size, item.units])) as Record<Size, number>,
}));
export function matchesProductQuery(product: Product, query: string): boolean {
  const searchable = [product.name, product.sku, product.category, product.color, product.fabric].join(" ").toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).every(word => searchable.includes(word));
}
export function getProductCategory(product: Product): Category { return product.category; }
export function getProductColor(product: Product): ProductColor { return product.color; }
export function productHref(product: Product) { return "/product/" + (product.slug || product.id); }
export function money(value: number) { return "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 2 }); }
