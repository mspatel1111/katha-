import {NextResponse} from "next/server";
import {getAdmin,auditAdmin} from "@/lib/admin-auth";
import {getD1} from "@/lib/catalog-db";
import {getSettings} from "@/lib/settings-db";
import {settingsSchema} from "@/lib/settings-validation";
import {z} from "zod";
export const dynamic="force-dynamic";
export async function GET(){
 if(!(await getAdmin()))return NextResponse.json({error:"Unauthorized"},{status:401});
 return NextResponse.json({settings:await getSettings()},{headers:{"Cache-Control":"no-store"}});
}
export async function PUT(request:Request){
 const admin=await getAdmin(request);if(!admin)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(Number(request.headers.get("content-length")??0)>65536)return NextResponse.json({error:"Settings too large."},{status:413});
 const envelope=z.object({settings:z.unknown(),revision:z.number().int().min(0)}).safeParse(await request.json().catch(()=>null));
 if(!envelope.success)return NextResponse.json({error:"Invalid settings update."},{status:400});
 const body=envelope.data;const parsed=settingsSchema.safeParse(body.settings);
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0].message},{status:400});
 const db=getD1();const current=await db.prepare("SELECT revision FROM store_settings WHERE key='store_config'").first<{revision:number}>();
 if(current&&current.revision!==body.revision)return NextResponse.json({error:"Settings changed. Refresh before saving."},{status:409});
 const result=await db.prepare("INSERT INTO store_settings(key,value,revision,updated_at) VALUES('store_config',?,1,datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value,revision=store_settings.revision+1,updated_at=datetime('now') WHERE store_settings.revision=? RETURNING revision").bind(JSON.stringify(parsed.data),body.revision??0).first();
 if(!result)return NextResponse.json({error:"Settings changed. Refresh before saving."},{status:409});
 await auditAdmin(admin,"store_settings_update","store_config");
 return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
