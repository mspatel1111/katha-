// Restricted Windows hosts may lack a passwd record. This fallback is CLI-only.
void import("node:module").then(({createRequire})=>{
 const requireModule=createRequire(__filename);const os=requireModule("node:os");
 try{os.userInfo();}catch{os.userInfo=()=>({username:process.env.USERNAME||"site-builder",uid:-1,gid:-1,shell:null,homedir:os.homedir()});}
 process.argv=[process.argv[0],requireModule.resolve("../node_modules/drizzle-kit/bin.cjs"),...process.argv.slice(2)];
 requireModule("../node_modules/drizzle-kit/bin.cjs");
});
