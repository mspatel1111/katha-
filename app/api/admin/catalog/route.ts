import { NextResponse } from "next/server";
import { z } from "zod";
import { auditAdmin, getAdmin } from "@/lib/admin-auth";
import { getCatalogProducts, getD1, upsertProduct } from "@/lib/catalog-db";
import { productSchema } from "@/lib/product-validation";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ products: await getCatalogProducts(true) }, { headers }); }
  catch { return NextResponse.json({ error: "Store data is unavailable. Please retry." }, { status: 503, headers }); }
}
export async function PUT(request: Request) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > 65536) return NextResponse.json({ error: "Product details are too large." }, { status: 413 });
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message, fields: parsed.error.flatten() }, { status: 400 });
  try {
    const id = await upsertProduct({ ...parsed.data, oldPrice: parsed.data.oldPrice ?? undefined, label: parsed.data.label ?? undefined });
    await auditAdmin(admin, "product_save", String(id));
    return NextResponse.json({ ok: true, id }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save product.";
    return NextResponse.json({ error: /UNIQUE/i.test(message) ? "SKU or slug is already used by another product." : /CHECK/i.test(message)?"This product or its stock changed. Refresh before saving.":"Could not save product. Please retry." }, { status: 409, headers });
  }
}
export async function DELETE(request: Request) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid product." }, { status: 400 });
  await getD1().prepare("UPDATE product_overrides SET active = 0, archived = 1, revision = revision + 1, updated_at = datetime('now') WHERE id = ?").bind(parsed.data.id).run();
  await auditAdmin(admin, "product_archive", String(parsed.data.id));
  return NextResponse.json({ ok: true }, { headers });
}
