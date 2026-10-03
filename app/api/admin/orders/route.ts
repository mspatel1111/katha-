import {NextResponse} from "next/server";
import {z} from "zod";
import {getAdmin,auditAdmin} from "@/lib/admin-auth";
import {getD1} from "@/lib/catalog-db";
export const dynamic="force-dynamic";
const statuses=["pending","confirmed","packed","shipped","delivered","cancelled"] as const;
const transitions:Record<string,string[]>={pending:["confirmed","cancelled"],confirmed:["packed","cancelled"],packed:["shipped","cancelled"],shipped:["delivered","cancelled"],delivered:[],cancelled:[]};
const headers={"Cache-Control":"no-store"};
function csvCell(value:unknown){let text=String(value??"");if(/^[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export async function GET(request:Request){
 if(!(await getAdmin()))return NextResponse.json({error:"Unauthorized"},{status:401});
 const db=getD1();const url=new URL(request.url);const id=url.searchParams.get("id");
 if(id){
  const order=await db.prepare("SELECT * FROM orders WHERE id=?").bind(id).first();
  if(!order)return NextResponse.json({error:"Order not found."},{status:404});
  const [items,timeline,inventory]=await db.batch([db.prepare("SELECT * FROM order_items WHERE order_id=?").bind(id),db.prepare("SELECT * FROM order_events WHERE order_id=? ORDER BY id").bind(id),db.prepare("SELECT * FROM inventory_changes WHERE order_id=? ORDER BY id").bind(id)]);
  return NextResponse.json({order:{...order,items:items.results,timeline:timeline.results,inventory:inventory.results}},{headers});
 }
 const query=(url.searchParams.get("q")??"").slice(0,100);const conditions:string[]=[];const values:string[]=[];
 if(query){conditions.push("(id LIKE ? OR customer_name LIKE ? OR phone LIKE ?)");values.push(...Array(3).fill("%"+query+"%"));}
 for(const[param,column]of[["status","status"],["payment","payment_status"]]){
  const value=url.searchParams.get(param);if(value){conditions.push(column+"=?");values.push(value);}
 }
 const from=url.searchParams.get("from");const to=url.searchParams.get("to");
 if(from&&/^\d{4}-\d{2}-\d{2}$/.test(from)){conditions.push("created_at>=?");values.push(from);}
 if(to&&/^\d{4}-\d{2}-\d{2}$/.test(to)){conditions.push("created_at<date(?,'+1 day')");values.push(to);}
 const page=Math.max(1,Math.min(10000,Number(url.searchParams.get("page"))||1));
 const base=" FROM orders"+(conditions.length?" WHERE "+conditions.join(" AND "):"");
 const exporting=url.searchParams.get("export")==="csv";
 const results=await db.prepare("SELECT *"+base+" ORDER BY created_at DESC LIMIT ? OFFSET ?").bind(...values,exporting?10000:50,exporting?0:(page-1)*50).all<Record<string,unknown>>();
 if(exporting){
 const columns=["id","created_at","customer_name","phone","email","address","landmark","city","state","pincode","subtotal","shipping_amount","discount_amount","amount","payment_method","payment_status","status","courier_name","tracking_number"];
 return new Response([columns.join(","),...results.results.map(row=>columns.map(c=>csvCell(row[c])).join(","))].join("\r\n"),{headers:{...headers,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="katha-orders.csv"'}});
 }
 const total=await db.prepare("SELECT COUNT(*) AS count"+base).bind(...values).first<{count:number}>();
 return NextResponse.json({orders:results.results,total:total?.count??0,page},{headers});
}
export async function PATCH(request:Request){
 const admin=await getAdmin(request);if(!admin)return NextResponse.json({error:"Unauthorized"},{status:401});
 const parsed=z.object({id:z.string().min(4).max(50),status:z.enum(statuses),expectedStatus:z.enum(statuses),adminNotes:z.string().max(2000).default(""),cancellationReason:z.string().max(500).default(""),courierName:z.string().max(100).default(""),trackingNumber:z.string().max(100).default(""),paymentStatus:z.enum(["cod","paid","pending","failed","refunded"]).optional()}).safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Invalid order update."},{status:400});
 const p=parsed.data;const db=getD1();const order=await db.prepare("SELECT status,payment_method,payment_status FROM orders WHERE id=?").bind(p.id).first<{status:string;payment_method:string;payment_status:string}>();
 if(!order)return NextResponse.json({error:"Order not found."},{status:404});
 if(order.status!==p.expectedStatus)return NextResponse.json({error:"This order changed. Refresh before saving."},{status:409});
 if(p.status!==order.status&&!transitions[order.status]?.includes(p.status))return NextResponse.json({error:"This status transition is not allowed."},{status:400});
 if(p.status==="cancelled"&&!p.cancellationReason.trim())return NextResponse.json({error:"Enter a cancellation reason."},{status:400});
 if(p.status==="shipped"&&(!p.courierName||!p.trackingNumber))return NextResponse.json({error:"Enter courier name and tracking number."},{status:400});
 if(p.paymentStatus&&p.paymentStatus!==order.payment_status&&!(order.payment_method==="cod"&&p.status==="delivered"&&p.paymentStatus==="paid"))return NextResponse.json({error:"Only collected COD payments may be marked paid."},{status:400});
 try{
 const result=await db.prepare("UPDATE orders SET status=?,admin_notes=?,cancellation_reason=?,courier_name=?,tracking_number=?,payment_status=COALESCE(?,payment_status),shipped_at=CASE WHEN ?='shipped' THEN COALESCE(shipped_at,datetime('now')) ELSE shipped_at END,delivered_at=CASE WHEN ?='delivered' THEN COALESCE(delivered_at,datetime('now')) ELSE delivered_at END,updated_at=datetime('now') WHERE id=? AND status=? RETURNING id")
 .bind(p.status,p.adminNotes,p.cancellationReason,p.courierName,p.trackingNumber,p.paymentStatus??null,p.status,p.status,p.id,p.expectedStatus).first();
 if(!result)return NextResponse.json({error:"Order changed. Refresh and retry."},{status:409});
 await auditAdmin(admin,"order_update",p.id+":"+p.status);
 return NextResponse.json({ok:true},{headers});
 }catch{return NextResponse.json({error:"Could not update order. Refresh and retry."},{status:409});}
}
