import assert from "node:assert/strict";
import test,{after} from "node:test";
import {createServer} from "vite";
const vite=await createServer({configFile:false,resolve:{alias:{"@":process.cwd()}},server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
test("cart validates stored items, merges sizes and detects stock/price changes",async()=>{
 const {parseCart,cartLines,changeCartSize}=await vite.ssrLoadModule("/lib/cart.ts");
 const {DEFAULT_PRODUCTS}=await vite.ssrLoadModule("/lib/catalog.ts");
 assert.deepEqual(parseCart({"1-S":99,"bad":2,"2-XXXL":2,"1-L":-1}),{"1-S":10,"2-XXXL":2});
 const p=DEFAULT_PRODUCTS[0];const next=changeCartSize({"1-S":2,"1-M":3},"1-S","M",p);
 assert.deepEqual(next,{"1-M":5});
 const lines=cartLines({"1-S":9,"999-M":1},[p],{"1-S":1});
 assert.equal(lines[0].stockChanged,true);assert.equal(lines[0].priceChanged,true);assert.equal(lines[1].available,false);
});
test("shipping uses configurable thresholds",async()=>{
 const {shippingFor,DEFAULT_SETTINGS}=await vite.ssrLoadModule("/lib/store-config.ts");
 assert.equal(shippingFor(0,DEFAULT_SETTINGS),0);
 assert.equal(shippingFor(1000,DEFAULT_SETTINGS),99);
 assert.equal(shippingFor(2999,DEFAULT_SETTINGS),0);
 assert.equal(shippingFor(1000,{shippingCharge:49,freeShippingThreshold:2000}),49);
});
test("device storage rejects null and incorrect shapes",async()=>{
 const {parseLocalValue}=await vite.ssrLoadModule("/lib/browser-store.ts");
 for(const raw of ["null","false","42","[]","broken"]){assert.deepEqual(parseLocalValue(raw),{});}
 assert.deepEqual(parseLocalValue('{}',true),[]);
 assert.deepEqual(parseLocalValue('[1,2]',true),[1,2]);
});
