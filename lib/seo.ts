export const SITE_ORIGIN="https://katha-ethnic-wear.yashpatel9724945.chatgpt.site";
export function pageMetadata(title:string,description:string,path:string,image="/images/katha-pink-saree-1200w.webp"){return {title,description,alternates:{canonical:SITE_ORIGIN+path},openGraph:{title,description,url:SITE_ORIGIN+path,type:"website" as const,images:[{url:SITE_ORIGIN+image}]},twitter:{card:"summary_large_image" as const,title,description,images:[SITE_ORIGIN+image]}};}
export function jsonLd(data:unknown){return JSON.stringify(data).replaceAll("<","\\u003c");}
