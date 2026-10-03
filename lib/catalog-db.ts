import { env } from "cloudflare:workers";
import { DEFAULT_PRODUCTS, SIZES, slugify, type Product, type ProductImage, type Size } from "./catalog";
import {DRAFT_PRODUCTS,DRAFT_CATALOG_KEY} from "./catalog-drafts";

export function getD1(): D1Database {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("Store database is unavailable.");
  return db;
}
export const stockColumns: Record<Size, string> = { S: "stock_s", M: "stock_m", L: "stock_l", XL: "stock_xl", XXL: "stock_xxl", XXXL: "stock_xxxl" };
type Row = Record<string, string | number | null> & { id: number };
let seeded: Promise<void> | undefined;
export async function ensureCatalogSeeded() {
  if (seeded) return seeded;
  seeded = (async () => {
    const db = getD1();
    if (await db.prepare("SELECT key FROM store_settings WHERE key = 'catalog_seeded_v1'").first()) return;
    const statements: D1PreparedStatement[] = [];
    for (const p of DEFAULT_PRODUCTS) {
      statements.push(prepareProductInsert(db, p));
      statements.push(db.prepare("UPDATE product_overrides SET sku = COALESCE(sku, ?), slug = COALESCE(slug, ?), category = CASE WHEN sku IS NULL THEN ? ELSE category END, color = CASE WHEN sku IS NULL THEN ? ELSE color END WHERE id = ?").bind(p.sku, p.slug, p.category, p.color, p.id));
    }
    const existing = await db.prepare("SELECT id, name, image FROM product_overrides").all<Row>();
    for (const p of existing.results) {
      statements.push(db.prepare("UPDATE product_overrides SET sku = COALESCE(sku, ?), slug = COALESCE(slug, ?) WHERE id = ?").bind("KATHA-" + p.id, slugify(String(p.name)) + "-" + p.id, p.id));
    }
    statements.push(db.prepare("INSERT INTO product_images (product_id, url, alt, display_order, is_primary) SELECT id, image, name, 0, 1 FROM product_overrides p WHERE NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id)"));
    statements.push(db.prepare("INSERT OR IGNORE INTO store_settings (key, value, updated_at) VALUES ('catalog_seeded_v1', 'true', datetime('now'))"));
    await db.batch(statements);
  })();
  try { await seeded; } catch (error) { seeded = undefined; throw error; }
}
const fields: Array<[keyof Product, string]> = [
  ["name","name"],["price","price"],["oldPrice","old_price"],["image","image"],["label","label"],
  ["active","active"],["sku","sku"],["slug","slug"],["category","category"],["color","color"],
  ["fabric","fabric"],["description","description"],["work","work"],["washCare","wash_care"],
  ["occasion","occasion"],["fit","fit"],["length","length"],["dispatchTime","dispatch_time"],
  ["featured","featured"],["newArrival","new_arrival"],["bestseller","bestseller"],
  ["displayOrder","display_order"],["lowStockThreshold","low_stock_threshold"],["archived","archived"],
];
const columns = [...fields.map(([, column]) => column), ...SIZES.map(size => stockColumns[size])];
function values(product: Product) {
  return [...fields.map(([key]) => typeof product[key] === "boolean" ? Number(product[key]) : product[key] ?? null), ...SIZES.map(size => product.stock[size])];
}
export function prepareProductInsert(db: D1Database, product: Product) {
  return db.prepare("INSERT OR IGNORE INTO product_overrides (id, " + columns.join(", ") + ", created_at, updated_at) VALUES (?, " + columns.map(() => "?").join(", ") + ", datetime('now'), datetime('now'))").bind(product.id, ...values(product));
}
let draftsSeeded:Promise<void>|undefined;
export async function ensureDraftCatalogSeeded(){
 if(draftsSeeded)return draftsSeeded;
 draftsSeeded=(async()=>{
  const db=getD1();
  if(await db.prepare("SELECT key FROM store_settings WHERE key=?").bind(DRAFT_CATALOG_KEY).first())return;
  const statements=DRAFT_PRODUCTS.map(product=>db.prepare("INSERT OR IGNORE INTO product_overrides (id,"+columns.join(",")+",created_at,updated_at) SELECT (SELECT COALESCE(MAX(id),0)+1 FROM product_overrides),"+columns.map(()=>"?").join(",")+",datetime('now'),datetime('now') WHERE NOT EXISTS(SELECT 1 FROM product_overrides WHERE sku=? OR slug=?) AND NOT EXISTS(SELECT 1 FROM store_settings WHERE key=?)").bind(...values(product),product.sku,product.slug,DRAFT_CATALOG_KEY));
  statements.push(db.prepare("INSERT INTO product_images(product_id,url,alt,display_order,is_primary) SELECT id,image,'Temporary KATHA reference photo for '||name,0,1 FROM product_overrides p WHERE sku LIKE 'KATHA-DRAFT-%' AND NOT EXISTS(SELECT 1 FROM product_images i WHERE i.product_id=p.id)"));
  statements.push(db.prepare("INSERT OR IGNORE INTO store_settings(key,value,updated_at) VALUES(?,'true',datetime('now'))").bind(DRAFT_CATALOG_KEY));
  await db.batch(statements);
 })();
 try{await draftsSeeded;}catch(error){draftsSeeded=undefined;throw error;}
}
function rowToProduct(row: Row, images: ProductImage[]): Product {
  const p: Record<string, unknown> = { id: row.id, stock: Object.fromEntries(SIZES.map(size => [size, row[stockColumns[size]]])), images, revision: row.revision, createdAt: row.created_at, updatedAt: row.updated_at };
  for (const [key, column] of fields) p[key] = ["active","featured","newArrival","bestseller","archived"].includes(key) ? row[column] === 1 : row[column] ?? undefined;
  p.image = images.find(image => image.primary)?.url ?? row.image;
  return p as Product;
}
export async function getCatalogProducts(includeInactive = false): Promise<Product[]> {
  await ensureCatalogSeeded();
  // Draft insertion is only reached by the owner-authorized admin catalog route.
  if(includeInactive)await ensureDraftCatalogSeeded();
  const db = getD1();
  const [products, images] = await db.batch([
    db.prepare("SELECT * FROM product_overrides " + (includeInactive ? "" : "WHERE active = 1 AND archived = 0 ") + "ORDER BY display_order, id"),
    db.prepare("SELECT * FROM product_images ORDER BY display_order, id"),
  ]);
  return (products.results as Row[]).map(row => rowToProduct(row, (images.results as Row[]).filter(image => image.product_id === row.id).map(image => ({
    id: image.id, url: String(image.url), alt: String(image.alt), displayOrder: Number(image.display_order), primary: image.is_primary === 1,
  }))));
}
export async function getProduct(identifier: string) {
  await ensureCatalogSeeded();
  const row=await getD1().prepare("SELECT id FROM product_overrides WHERE active=1 AND archived=0 AND (slug=? OR CAST(id AS TEXT)=?) LIMIT 1").bind(identifier,identifier).first<{id:number}>();
  if(!row)return undefined;
  return (await getCatalogPage(new URLSearchParams({ids:String(row.id)}))).products[0];
}
export function invalidateCatalogCache() { /* authoritative D1 reads; edge caching is handled separately */ }

export async function getCatalogPage(search:URLSearchParams,includeInactive=false){
 await ensureCatalogSeeded();const db=getD1();
 const clauses=includeInactive?[]:["active=1","archived=0"];const bindings:(string|number)[]=[];
 const ids=(search.get("ids")??"").split(",").filter(id=>/^\d+$/.test(id)).map(Number).filter(id=>Number.isSafeInteger(id)&&id>0).slice(0,20);
 if(search.has("ids")&&!ids.length)return {products:[],total:0,page:1,limit:20};
 if(ids.length){clauses.push("id IN ("+ids.map(()=>"?").join(",")+")");bindings.push(...ids);}
 const query=(search.get("q")??"").trim().slice(0,100);
 if(query){clauses.push("(name LIKE ? ESCAPE '\\' OR sku LIKE ? ESCAPE '\\' OR fabric LIKE ? ESCAPE '\\')");const term="%"+query.replace(/[\\%_]/g,"\\$&")+"%";bindings.push(term,term,term);}
 for(const field of ["category","color"]){const value=search.get(field);if(value&&value!=="all"){clauses.push(field+"=?");bindings.push(value);}}
 const size=search.get("size") as Size;if(SIZES.includes(size))clauses.push(stockColumns[size]+">0");
 const sum=SIZES.map(size=>stockColumns[size]).join("+");const availability=search.get("availability");
 if(availability==="in-stock")clauses.push("("+sum+")>0");if(availability==="out-of-stock")clauses.push("("+sum+")=0");
 const sort=search.get("sort");const order=sort==="price-low"?"price,id":sort==="price-high"?"price DESC,id":sort==="name"?"name,id":"featured DESC,display_order,id";
 const rawPage=Number(search.get("page"));const rawLimit=Number(search.get("limit"));
 const page=Number.isFinite(rawPage)?Math.max(1,Math.min(10000,Math.floor(rawPage)||1)):1;
 const limit=Number.isFinite(rawLimit)?Math.max(1,Math.min(48,Math.floor(rawLimit)||24)):24;
 const where=clauses.length?" WHERE "+clauses.join(" AND "):"";
 const rows=await db.prepare("SELECT * FROM product_overrides"+where+" ORDER BY "+order+" LIMIT ? OFFSET ?").bind(...bindings,ids.length?20:limit,ids.length?0:(page-1)*limit).all<Row>();
 const total=await db.prepare("SELECT COUNT(*) AS total FROM product_overrides"+where).bind(...bindings).first<{total:number}>();
 const gallery=rows.results.length?await db.prepare("SELECT * FROM product_images WHERE product_id IN ("+rows.results.map(()=>"?").join(",")+") ORDER BY display_order,id").bind(...rows.results.map(row=>row.id)).all<Row>():{results:[]};
 return {products:rows.results.map(row=>rowToProduct(row,gallery.results.filter(image=>image.product_id===row.id).map(image=>({id:image.id,url:String(image.url),alt:String(image.alt),displayOrder:Number(image.display_order),primary:image.is_primary===1})))),total:total?.total??0,page,limit};
}
export async function upsertProduct(product: Product): Promise<number> {
  await ensureCatalogSeeded();
  const db = getD1();
  const id = product.id || Number((await db.prepare("SELECT COALESCE(MAX(id),0)+1 AS id FROM product_overrides").first<{id:number}>())!.id);
  const token = crypto.randomUUID();
  const gallery = product.images.length ? product.images : [{ url: product.image, alt: product.name, displayOrder: 0, primary: true }];
  const statements: D1PreparedStatement[] = [];
  if (product.id) {
    statements.push(db.prepare("INSERT INTO operation_guards(token,passed) VALUES(?,COALESCE((SELECT CASE WHEN revision=? THEN 1 ELSE 0 END FROM product_overrides WHERE id=?),0))").bind(token,product.revision,id));
    for (const size of SIZES) statements.push(db.prepare("INSERT INTO inventory_changes(product_id,size,delta,reason,actor,created_at) SELECT id,?,?-"+stockColumns[size]+",'admin_adjustment','admin',datetime('now') FROM product_overrides WHERE id=? AND "+stockColumns[size]+"<>?").bind(size,product.stock[size],id,product.stock[size]));
    statements.push(db.prepare("UPDATE product_overrides SET "+columns.map(column=>column+"=?").join(",")+", revision=revision+1, updated_at=datetime('now') WHERE id=?").bind(...values(product),id));
  } else {
    statements.push(db.prepare("INSERT INTO product_overrides(id,"+columns.join(",")+",created_at,updated_at) VALUES(?,"+columns.map(()=>"?").join(",")+",datetime('now'),datetime('now'))").bind(id,...values(product)));
  }
  statements.push(db.prepare("DELETE FROM product_images WHERE product_id=?").bind(id));
  statements.push(...gallery.map((image,index)=>db.prepare("INSERT INTO product_images(product_id,url,alt,display_order,is_primary) VALUES(?,?,?,?,?)").bind(id,image.url,image.alt,index,Number(image.primary))));
  if(product.id)statements.push(db.prepare("DELETE FROM operation_guards WHERE token=?").bind(token));
  await db.batch(statements);
  return id;
}
