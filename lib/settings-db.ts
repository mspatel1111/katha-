import {getD1} from "./catalog-db";
import {DEFAULT_SETTINGS,type StoreSettings} from "./store-config";
export async function getSettings():Promise<StoreSettings & {revision:number}>{
 const row=await getD1().prepare("SELECT value,revision FROM store_settings WHERE key='store_config'").first<{value:string;revision:number}>();
 return row?{...DEFAULT_SETTINGS,...JSON.parse(row.value),revision:row.revision}:{...DEFAULT_SETTINGS,revision:0};
}
