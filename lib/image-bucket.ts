import {env} from "cloudflare:workers";
export function getImageBucket(){return (env as unknown as {BUCKET?:R2Bucket}).BUCKET;}
