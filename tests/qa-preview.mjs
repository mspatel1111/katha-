import http from "node:http";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {createRuntime} from "./runtime.mjs";
const {runtime}=await createRuntime();
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,"http://localhost").pathname;
 if(/^\/(assets|images)\/[-a-zA-Z0-9_./]+$/.test(pathname)||/^\/katha-logo.*\.webp$/.test(pathname)||pathname==="/favicon.svg"){
  try{const file=await readFile(path.resolve("dist/client","."+pathname));res.writeHead(200,{"Content-Type":{".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".webp":"image/webp",".jpg":"image/jpeg"}[path.extname(pathname)]??"application/octet-stream"});res.end(file);return;}catch{/* Let the worker return a proper missing asset response. */}
 }
 try{const body=await Array.fromAsync(req);const response=await runtime.dispatchFetch("http://"+req.headers.host+req.url,{method:req.method,headers:req.headers,...(!["GET","HEAD"].includes(req.method)?{body:Buffer.concat(body)}:{})});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){console.error(e);res.writeHead(500);res.end("QA preview unavailable");}
});
server.listen(Number(process.env.KATHA_QA_PORT)||0,"127.0.0.1",()=>console.log("KATHA isolated QA preview: http://127.0.0.1:"+server.address().port));
async function close(){server.close();await runtime.dispose();process.exit(0);}process.on("SIGINT",close);process.on("SIGTERM",close);
