import assert from "node:assert/strict";
import test from "node:test";
import {DatabaseSync} from "node:sqlite";
import {readdir,readFile} from "node:fs/promises";
test("stock reservations, concurrent attempts and cancellation are atomic and idempotent",async()=>{
 const db=new DatabaseSync(":memory:");
 for(const file of(await readdir("drizzle")).filter(name=>name.endsWith(".sql")).sort())for(const sql of(await readFile("drizzle/"+file,"utf8")).split("--> statement-breakpoint").filter(s=>s.trim()))db.exec(sql);
 db.exec("INSERT INTO product_overrides(id,name,price,image,stock_s) VALUES(1,'Style',2000,'/images/test.webp',2)");
 const order=(id,quantity)=>{db.exec("BEGIN");try{db.prepare("INSERT INTO orders(id,receipt,request_id,customer_name,email,phone,address,city,state,pincode,amount,payment_method,status) VALUES(?,?,?,'Customer','a@b.com','9999999999','Street','City','Gujarat','383305',2000,'cod','confirmed')").run(id,id,id);db.prepare("INSERT INTO order_items(order_id,product_id,product_name,size,quantity,unit_price) VALUES(?,1,'Style','S',?,2000)").run(id,quantity);db.exec("COMMIT");}catch(error){db.exec("ROLLBACK");throw error;}};
 order("KATA",2);assert.equal(db.prepare("SELECT stock_s FROM product_overrides").get().stock_s,0);
 assert.throws(()=>order("KATB",1),/CHECK/);assert.equal(db.prepare("SELECT COUNT(*) c FROM orders").get().c,1);
 db.exec("UPDATE orders SET status='cancelled' WHERE id='KATA'");assert.equal(db.prepare("SELECT stock_s FROM product_overrides").get().stock_s,2);
 db.exec("UPDATE orders SET status='cancelled' WHERE id='KATA'");assert.equal(db.prepare("SELECT stock_s FROM product_overrides").get().stock_s,2);
 assert.equal(db.prepare("SELECT COUNT(*) c FROM inventory_changes WHERE reason='order_cancelled'").get().c,1);
 assert.throws(()=>db.exec("UPDATE orders SET status='confirmed' WHERE id='KATA'"),/final/);
 assert.throws(()=>order("KATA",1),/UNIQUE/);
 db.close();
});
