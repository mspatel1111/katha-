import {NextResponse} from "next/server";
import {getSettings} from "@/lib/settings-db";
export const dynamic="force-dynamic";
export async function GET(){
 try{return NextResponse.json({settings:await getSettings(),onlineEnabled:false},{headers:{"Cache-Control":"public, max-age=0, s-maxage=15"}});}
 catch{return NextResponse.json({error:"Store settings are unavailable."},{status:503});}
}
