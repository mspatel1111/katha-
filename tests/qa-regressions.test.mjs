import assert from "node:assert/strict";
import test,{after} from "node:test";
import {createServer} from "vite";
import {createHmac} from "node:crypto";
import {createRuntime} from "./runtime.mjs";
const vite=await createServer({configFile:false,resolve:{alias:{"@":process.cwd()}},server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
const owner={"oai-authenticated-user-email":"yashpatel9724945@gmail.com",origin:"http://localhost"};
const customer={name:"QA Customer",phone:"9999999999",email:"qa@example.com",address:"Test apartment, Test Street",city:"Ranasan",state:"Gujarat",pincode:"383305",landmark:""};
function api(runtime){let ip=0;return async(path,body,headers={},method=body?"POST":"GET")=>{
 const response=await runtime.dispatchFetch("http://localhost"+path,{method,headers:{"Content-Type":"application/json","cf-connecting-ip":"192.0.2."+(++ip),...headers},...(body?{body:JSON.stringify(body)}:{})});
 return {status:response.status,headers:response.headers,data:await response.json()};
};}

test("optional edge cache tolerates denied getters and rejected reads/writes",async()=>{
 const {readEdgeCache,writeEdgeCache}=await vite.ssrLoadModule("/lib/edge-cache.ts");
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,"caches");
 const request=new Request("http://localhost/api/products");
 try{
  Object.defineProperty(globalThis,"caches",{configurable:true,writable:true,value:Object.defineProperty({},"default",{get(){throw new Error("Cache denied");}})});
  assert.deepEqual(await readEdgeCache(request),{});
  globalThis.caches={default:{match:async()=>{throw new Error("Read failed");}}};
  assert.deepEqual(await readEdgeCache(request),{});
  await assert.doesNotReject(writeEdgeCache({put:async()=>{throw new Error("Write failed");}},request,new Response("ok")));
  const response=new Response("cached");globalThis.caches={default:{match:async()=>response}};
  assert.equal((await readEdgeCache(request)).response,response);
 }finally{if(descriptor)Object.defineProperty(globalThis,"caches",descriptor);else delete globalThis.caches;}
});

test("storage-denied checkout retry state survives reads/writes/removal in memory",async()=>{
 const {readSession,writeSession,removeSession}=await vite.ssrLoadModule("/lib/session-store.ts");
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,"sessionStorage");
 try{
  Object.defineProperty(globalThis,"sessionStorage",{configurable:true,get(){throw new Error("Storage denied");}});
  assert.equal(readSession("qa-attempt"),null);
  assert.doesNotThrow(()=>writeSession("qa-attempt",'{"id":"retry"}'));
  assert.equal(readSession("qa-attempt"),'{"id":"retry"}');
  assert.doesNotThrow(()=>writeSession("qa-last-order",'{"id":"accepted"}'));
  removeSession("qa-attempt");assert.equal(readSession("qa-attempt"),null);
 }finally{if(descriptor)Object.defineProperty(globalThis,"sessionStorage",descriptor);else delete globalThis.sessionStorage;}
});

test("actual built worker serves catalog and POST routes with default cache denied",async()=>{
 const {runtime}=await createRuntime({denyDefaultCache:true});const request=api(runtime);
 try{
  const products=await request("/api/products");assert.equal(products.status,200);assert.equal(products.data.total,4);assert.equal(products.headers.get("x-katha-cache"),"BYPASS");
  assert.equal((await request("/api/settings")).status,200);
  assert.equal((await request("/api/checkout/quote",{items:[{productId:1,size:"M",quantity:1}]})).status,200);
 }finally{await runtime.dispose();}
});

test("public IDs never expose drafts/archives and pagination stays finite",async()=>{
 const {runtime}=await createRuntime();const request=api(runtime);
 try{
  const all=await request("/api/admin/catalog",null,owner);const draft=all.data.products.find(p=>!p.active);
  for(const ids of [String(draft.id),"","not-a-number","99999999999999999999999999999"]){const result=await request("/api/products?ids="+ids);assert.equal(result.status,200);assert.equal(result.data.total,0);}
  const mixed=await request("/api/products?ids=1,"+draft.id);assert.equal(mixed.data.products.length,1);assert.equal(mixed.data.products[0].id,1);
  assert.equal((await request("/api/admin/catalog",{id:1},owner,"DELETE")).status,200);
  assert.equal((await request("/api/products?ids=1")).data.total,0);
  for(const page of ["Infinity","NaN","99999999999999999999999999999999999999999999999999999999999999999999999","-1","1.5"]){const result=await request("/api/products?page="+page);assert.equal(result.status,200);assert.ok(Number.isInteger(result.data.page)&&result.data.page>=1&&result.data.page<=10000);}
 }finally{await runtime.dispose();}
});

test("same checkout key accepts equivalent retries but rejects changed orders",async()=>{
 const {runtime,db}=await createRuntime();const request=api(runtime);
 try{
  const payload={requestId:crypto.randomUUID(),customer,items:[{productId:1,size:"M",quantity:2}],couponCode:"",policyAccepted:true,paymentMethod:"cod"};
  const placed=await request("/api/orders",payload);assert.equal(placed.status,200);
  assert.equal((await request("/api/orders",payload)).data.orderId,placed.data.orderId);
  const merged=await request("/api/orders",{...payload,items:[{productId:1,size:"M",quantity:1},{productId:1,size:"M",quantity:1}]});assert.equal(merged.status,200);
  for(const change of [{customer:{...customer,name:"Changed"}},{items:[{productId:1,size:"L",quantity:2}]},{expectedTotal:1},{paymentMethod:"online"},{couponCode:"DIFFERENT"}])assert.equal((await request("/api/orders",{...payload,...change})).status,409);
  assert.equal((await db.prepare("SELECT COUNT(*) count FROM orders").first()).count,1);
  assert.equal((await db.prepare("SELECT stock_m FROM product_overrides WHERE id=1").first()).stock_m,6);
 }finally{await runtime.dispose();}
});

test("phone-protected tracking returns courier and shipment details only",async()=>{
 const {runtime}=await createRuntime();const request=api(runtime);
 try{
  const placed=await request("/api/orders",{requestId:crypto.randomUUID(),customer,items:[{productId:1,size:"M",quantity:1}],policyAccepted:true,paymentMethod:"cod"});
  const id=placed.data.orderId;
  assert.equal((await request("/api/admin/orders",{id,status:"packed",expectedStatus:"confirmed",adminNotes:"Private QA note"},owner,"PATCH")).status,200);
  assert.equal((await request("/api/admin/orders",{id,status:"shipped",expectedStatus:"packed",courierName:"QA Courier",trackingNumber:"QA123",adminNotes:"Private QA note"},owner,"PATCH")).status,200);
  const tracked=await request("/api/orders/track",{orderId:id,phone:customer.phone});assert.equal(tracked.status,200);assert.equal(tracked.data.order.courier_name,"QA Courier");assert.equal(tracked.data.order.tracking_number,"QA123");assert.ok(tracked.data.order.shipped_at);assert.equal(tracked.data.order.admin_notes,undefined);
  assert.equal((await request("/api/orders/track",{orderId:id,phone:"8888888888"})).status,404);
 }finally{await runtime.dispose();}
});

test("keys alone cannot activate online checkout; signed late payments preserve fulfillment",async()=>{
 const secret="isolated-qa-secret-not-a-live-key";
 const {runtime,db}=await createRuntime({bindings:{CASHFREE_APP_ID:"isolated-qa",CASHFREE_SECRET_KEY:secret}});const request=api(runtime);
 const webhook=async(orderId,amount,status,paymentId)=>{
  const body=JSON.stringify({type:"QA_"+status,data:{order:{order_id:orderId,order_amount:amount,order_currency:"INR"},payment:{cf_payment_id:paymentId,payment_status:status,payment_amount:amount,payment_currency:"INR"}}});
  const timestamp=String(Date.now());const signature=createHmac("sha256",secret).update(timestamp+body).digest("base64");
  const response=await runtime.dispatchFetch("http://localhost/api/payments/cashfree/webhook",{method:"POST",headers:{"Content-Type":"application/json","x-webhook-timestamp":timestamp,"x-webhook-signature":signature},body});await response.text();return response.status;
 };
 try{
  const base={customer,items:[{productId:1,size:"M",quantity:1}],policyAccepted:true,paymentMethod:"cod"};
  assert.equal((await request("/api/orders",{...base,requestId:crypto.randomUUID(),paymentMethod:"online"})).status,503);
  for(const target of ["pending","packed","shipped","delivered","cancelled"]){
   const placed=await request("/api/orders",{...base,requestId:crypto.randomUUID()});assert.equal(placed.status,200);const id=placed.data.orderId;
   await db.prepare("UPDATE orders SET status=?,payment_method='online',payment_status='pending' WHERE id=?").bind(target,id).run();
   const stock=(await db.prepare("SELECT stock_m FROM product_overrides WHERE id=1").first()).stock_m;
   assert.equal(await webhook(id,placed.data.amount,"FAILED",id+"-failed"),200);
   assert.equal(await webhook(id,placed.data.amount,"PENDING",id+"-pending"),200);
   assert.equal((await db.prepare("SELECT payment_status FROM orders WHERE id=?").bind(id).first()).payment_status,"failed");
   assert.equal(await webhook(id,placed.data.amount,"SUCCESS",id+"-success"),200);
   assert.equal(await webhook(id,placed.data.amount,"SUCCESS",id+"-success"),200);
   assert.equal(await webhook(id,placed.data.amount,"FAILED",id+"-late-failed"),200);
   const order=await db.prepare("SELECT status,payment_status FROM orders WHERE id=?").bind(id).first();assert.equal(order.payment_status,"paid");assert.equal(order.status,target==="pending"?"confirmed":target);
   assert.equal((await db.prepare("SELECT stock_m FROM product_overrides WHERE id=1").first()).stock_m,stock);
  }
  assert.equal((await request("/api/payments/cashfree/webhook",{}, {"x-webhook-signature":"invalid","x-webhook-timestamp":String(Date.now())})).status,401);
 }finally{await runtime.dispose();}
});
