import assert from "node:assert/strict";
import test,{after} from "node:test";
import {access} from "node:fs/promises";
import {createServer} from "vite";
const vite=await createServer({configFile:false,resolve:{alias:{"@":process.cwd()}},server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
after(()=>vite.close());
test("100 draft starters have unique identities, safe defaults and existing optimized reference images",async()=>{
 const {DRAFT_PRODUCTS}=await vite.ssrLoadModule("/lib/catalog-drafts.ts");
 const {productSchema}=await vite.ssrLoadModule("/lib/product-validation.ts");
 assert.equal(DRAFT_PRODUCTS.length,100);
 assert.equal(new Set(DRAFT_PRODUCTS.map(p=>p.sku)).size,100);
 assert.equal(new Set(DRAFT_PRODUCTS.map(p=>p.slug)).size,100);
 for(const product of DRAFT_PRODUCTS){
  assert.equal(productSchema.safeParse(product).success,true);
  assert.equal(product.active,false);assert.equal(product.price,0);
  assert.ok(Object.values(product.stock).every(stock=>stock===0));
  assert.match(product.description,/reused KATHA reference/);
  await access("public"+product.image);
 }
});
