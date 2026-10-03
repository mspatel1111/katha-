import {NextResponse} from "next/server";
import {getAdmin} from "@/lib/admin-auth";
import {getD1} from "@/lib/catalog-db";
export const dynamic="force-dynamic";
export async function GET(){
 if(!(await getAdmin()))return NextResponse.json({error:"Unauthorized"},{status:401});
 const history=await getD1().prepare("SELECT * FROM inventory_changes ORDER BY id DESC LIMIT 200").all();
 return NextResponse.json({history:history.results},{headers:{"Cache-Control":"no-store"}});
}
