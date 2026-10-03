export async function optimizedImageForm(file:File){
 if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Use JPG, PNG or WebP.");
 if(file.size>40*1024*1024)throw new Error("Image must be under 40 MB.");
 const bitmap=await createImageBitmap(file);
 try{
  const form=new FormData();form.set("sourceType",file.type);
  for(const width of [480,800,1200,1600]){
   const scale=Math.min(1,width/bitmap.width);
   const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
   const context=canvas.getContext("2d");if(!context)throw new Error("Image processing is unavailable in this browser.");context.drawImage(bitmap,0,0,canvas.width,canvas.height);
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?.type==="image/webp"?resolve(value):reject(new Error("Use a browser with WebP image support.")),"image/webp",.85));
   form.set("image"+width,new File([blob],width+"w.webp",{type:"image/webp"}));
  }return form;
 }finally{bitmap.close();}
}
