/* eslint-disable @next/next/no-img-element -- URLs are pre-generated WebP variants with an explicit srcset. */
import type { ImgHTMLAttributes } from "react";

type ResponsiveImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  src: string;
  alt: string;
};

export function ResponsiveImage({ src, alt, sizes = "(max-width: 680px) 82vw, (max-width: 1000px) 45vw, 25vw", ...props }: ResponsiveImageProps) {
  const bundled = src.startsWith("/images/katha-") && src.endsWith("-4k.jpg");
  const uploaded = src.startsWith("/api/images/products/") && src.endsWith("-master.webp");
  const optimized = bundled || uploaded;
  const source = (width: number) => bundled
    ? src.replace("-4k.jpg", `-${width}w.jpg`)
    : src.replace("-master.webp", `-${width}w.webp`);
  const webp = (width: number) => bundled
    ? src.replace("-4k.jpg", `-${width}w.webp`)
    : source(width);
  const imageProps = {
    width: optimized ? 800 : undefined,
    height: optimized ? 1200 : undefined,
    sizes: optimized ? sizes : undefined,
    decoding: "async" as const,
    fetchPriority: props.loading === "lazy" ? "low" as const : props.fetchPriority,
    ...props,
  };
  const sources = [480, 800, 1200, 1600];
  if (!optimized) return <img src={src} alt={alt} {...imageProps} />;

  // Keep the URLs in the server-rendered HTML. Native lazy loading can start as
  // soon as HTML arrives, without waiting for React hydration on slow phones.
  return <img
    src={webp(480)}
    srcSet={sources.map((width) => `${webp(width)} ${width}w`).join(", ")}
    alt={alt}
    {...imageProps}
  />;
}
