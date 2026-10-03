import path from "node:path";
import {glob,readFile,readdir} from "node:fs/promises";
import {Miniflare} from "miniflare";
export async function createRuntime({denyDefaultCache=false,bindings={}}={}){
 const entry={type:"ESModule",path:path.resolve("dist/server/index.js")};
 if(denyDefaultCache)entry.contents='Object.defineProperty(caches,"default",{get(){throw new Error("This Worker is not permitted to access the default cache.");}});\n'+await readFile(entry.path,"utf8");
 const runtime=new Miniflare({modules:[entry,...(await Array.fromAsync(glob("**/*.js",{cwd:path.resolve("dist/server")}))).filter(file=>file!=="index.js").map(file=>({type:"ESModule",path:path.resolve("dist/server",file)}))],modulesRoot:path.resolve("dist/server"),compatibilityDate:"2026-05-22",compatibilityFlags:["nodejs_compat"],bindings,d1Databases:{DB:"test-catalog"},r2Buckets:["BUCKET"],serviceBindings:{ASSETS:async request=>{const url=new URL(request.url);try{const file=await readFile(path.resolve("dist/client","."+url.pathname));const ext=path.extname(url.pathname);return new Response(file,{headers:{"Content-Type":{".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".webp":"image/webp",".jpg":"image/jpeg",".png":"image/png"}[ext]??"application/octet-stream"}});}catch{return new Response("Not found",{status:404});}}}});
 const db=await runtime.getD1Database("DB");
 for(const name of(await readdir("drizzle")).filter(file=>file.endsWith(".sql")).sort())for(const sql of(await readFile("drizzle/"+name,"utf8")).split("--> statement-breakpoint").filter(sql=>sql.trim()))await db.prepare(sql).run();
 return {runtime,db};
}
