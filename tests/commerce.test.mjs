import assert from "node:assert/strict";
import test,{after} from "node:test";
import {createServer} from "vite";
const vite=await createServer({configFile:false,resolve:{alias:{"@":process.cwd()}},server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
test("coupons enforce dates, restrictions, minimum, limits and maximum discount",async()=>{
 const {calculateTotals,validateLines,customerSchema}=await vite.ssrLoadModule("/lib/commerce.ts");
 const {DEFAULT_PRODUCTS}=await vite.ssrLoadModule("/lib/catalog.ts");
 const {DEFAULT_SETTINGS}=await vite.ssrLoadModule("/lib/store-config.ts");
 const lines=validateLines([{productId:1,size:"M",quantity:1}],DEFAULT_PRODUCTS);
 const coupon={id:1,code:"TEST",kind:"percentage",value:20,minimumAmount:1000,maximumDiscount:200,startAt:null,endAt:null,usageLimit:1,usageCount:0,active:true,productIds:[1],categories:[],revision:0};
 assert.equal(calculateTotals(lines,DEFAULT_SETTINGS,coupon).discount,200);
 for(const change of [{active:false},{usageCount:1},{minimumAmount:5000},{endAt:"2000-01-01T00:00:00Z"},{productIds:[2]}])assert.throws(()=>calculateTotals(lines,DEFAULT_SETTINGS,{...coupon,...change}));
 assert.throws(()=>validateLines([{productId:1,size:"S",quantity:5},{productId:1,size:"S",quantity:5}],DEFAULT_PRODUCTS));
 assert.equal(customerSchema.safeParse({name:"Customer",email:"a@b.com",phone:"12345",address:"Street address",city:"City",state:"Gujarat",pincode:"038330"}).success,false);
});
