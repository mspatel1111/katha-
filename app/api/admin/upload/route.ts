import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { auditAdmin, getAdmin } from "@/lib/admin-auth";
import { logEvent } from "@/lib/monitoring";
import {webpDimensions} from "@/lib/webp";
import {getImageBucket} from "@/lib/image-bucket";

export const dynamic = "force-dynamic";
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  const user = await getAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if(Number(request.headers.get("content-length")??0)>16*1024*1024)return NextResponse.json({error:"Upload is too large."},{status:413});
  const formData = await request.formData().catch(()=>null);
  if(!formData)return NextResponse.json({error:"Invalid image upload."},{status:400});
  if(formData.has("image480")){
    const bucket=getImageBucket();if(!bucket)return NextResponse.json({error:"Image storage is unavailable."},{status:503});
    const variants:Uint8Array[]=[];
    for(const width of [480,800,1200,1600]){
      const file=formData.get("image"+width);if(!(file instanceof File)||file.type!=="image/webp"||file.size>3*1024*1024)return NextResponse.json({error:"Invalid optimized image."},{status:400});
      const bytes=new Uint8Array(await file.arrayBuffer());const dimensions=webpDimensions(bytes);
      if(!dimensions||dimensions.width>width||dimensions.width<1||dimensions.height<1||dimensions.height>10000)return NextResponse.json({error:"Invalid WebP dimensions."},{status:400});variants.push(bytes);
    }
    const id=crypto.randomUUID();const keys=[480,800,1200,1600].map(width=>"products/"+id+"-"+width+"w.webp");
    try{await Promise.all(variants.map((bytes,index)=>bucket.put(keys[index],bytes,{httpMetadata:{contentType:"image/webp",cacheControl:"public, max-age=31536000, immutable"}})));}
    catch{await bucket.delete(keys).catch(()=>undefined);return NextResponse.json({error:"Image upload failed. Please retry."},{status:503});}
    await auditAdmin(user,"product_image_upload",id);
    return NextResponse.json({url:"/api/images/products/"+id+"-master.webp"});
  }
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image." }, { status: 400 });
  const extension = allowedTypes.get(file.type);
  if (!extension) return NextResponse.json({ error: "Use JPG, PNG or WebP." }, { status: 400 });
  if (file.size > 12 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 12 MB." }, { status: 400 });

  const runtime = env as unknown as {
    BUCKET?: R2Bucket;
    IMAGES?: {
      input(stream: ReadableStream): {
        transform(options: { width: number; fit: string }): {
          output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
        };
      };
    };
  };
  if (!runtime.BUCKET || !runtime.IMAGES) return NextResponse.json({ error: "Optimized image storage is unavailable." }, { status: 503 });

  const id = crypto.randomUUID();
  const bytes = await file.arrayBuffer();
  const widths = [480, 800, 1200, 1600] as const;
  const keys = widths.map((width) => `products/${id}-${width}w.webp`);
  try {
    const images = await Promise.all(widths.map(async (width) => {
      const transformed = await runtime.IMAGES!
        .input(new Blob([bytes], { type: file.type }).stream())
        .transform({ width, fit: "scale-down" })
        .output({ format: "image/webp", quality: 82 });
      const response = transformed.response();
      if (!response.ok || !response.body) throw new Error(`Image transform failed at ${width}px`);
      return response;
    }));
    await Promise.all(images.map((image, index) => runtime.BUCKET!.put(keys[index], image.body, {
      httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" },
      customMetadata: { width: String(widths[index]), sourceType: file.type },
    })));
  } catch (error) {
    await runtime.BUCKET.delete(keys).catch(() => undefined);
    logEvent("error", "product_image_optimization_failed", { message: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Image optimization failed. Please try another image." }, { status: 500 });
  }
  await auditAdmin(user, "product_image_upload", id);
  return NextResponse.json({ url: `/api/images/products/${id}-master.webp` });
}
