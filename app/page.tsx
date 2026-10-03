import Link from "next/link";
import {getSettings} from "@/lib/settings-db";
import {getCatalogPage} from "@/lib/catalog-db";
import {pageMetadata,jsonLd,SITE_ORIGIN} from "@/lib/seo";
import { ArrowRight, BadgeIndianRupee, Camera, ExternalLink, Gift, LockKeyhole, MapPin, MessageCircle, Phone, Truck } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { HomeHeader } from "@/app/home-header";
import { HomeProducts } from "@/app/home-products";
import { StoreFooter } from "@/app/store-footer";
import { ResponsiveImage } from "@/app/responsive-image";

const CATEGORY_IMAGES: Record<string, string> = {
  Kurtis: "/images/katha-emerald-look-4k.jpg",
  Sarees: "/images/katha-pink-saree-4k.jpg",
  "Co-ord Sets": "/images/katha-wine-look-4k.jpg",
  "Festive Wear": "/images/katha-red-festive-look-4k.jpg",
  Dupattas: "/images/katha-teal-look-4k.jpg",
};

const LOOKBOOK = [
  ["/images/katha-pink-saree-4k.jpg", "Pink checked saree with floral details"],
  ["/images/katha-blue-mirror-look-4k.jpg", "Blue mirror-work ethnic dress"],
  ["/images/katha-red-festive-look-4k.jpg", "Red festive layered ethnic set"],
  ["/images/katha-rust-look-4k.jpg", "Rust orange flowing ethnic dress"],
  ["/images/katha-mustard-look-4k.jpg", "Mustard embroidered ethnic dress"],
  ["/images/katha-teal-look-4k.jpg", "Teal traditional co-ord set"],
  ["/images/katha-emerald-look-4k.jpg", "Emerald green ethnic set"],
  ["/images/katha-wine-look-4k.jpg", "Wine pleated ethnic set"],
  ["/images/katha-violet-look-4k.jpg", "Violet pleated festive dress"],
] as const;

export const dynamic="force-dynamic";
export async function generateMetadata(){const s=await getSettings();return pageMetadata(s.storeName+" | Modern Indian Clothing",s.heroDescription,"/");}
export default async function Home() {
  const [settings,catalog]=await Promise.all([getSettings(),getCatalogPage(new URLSearchParams("limit=4"))]);
  return (
    <main id="top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({"@context":"https://schema.org","@type":"ClothingStore",name:settings.storeName,url:SITE_ORIGIN,telephone:settings.phone,address:settings.address,sameAs:[settings.instagramUrl,settings.mapsUrl]})}}/>
      <div className="announcement">
        <span>{settings.announcement}</span>
        <span className="announcement-secondary">Sizes S to XXXL available</span>
      </div>

      <HomeHeader />

      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="eyebrow">The KATHA promise</p>
          <h1 id="hero-heading">{settings.heroTitle}</h1>
          <p className="hero-description">{settings.heroDescription}</p>
          <Link className="dark-button" href="#new-in">Shop the edit <ArrowRight /></Link>
        </div>
        <div className="hero-image-wrap">
          <ResponsiveImage src="/images/katha-pink-saree-4k.jpg" alt="Pink checked saree with floral details at KATHA" className="hero-image" sizes="(max-width: 680px) 100vw, 57vw" fetchPriority="high" decoding="async" />
        </div>
      </section>

      <section className="category-section" aria-labelledby="category-heading">
        <div className="category-heading"><p className="eyebrow">Explore the collection</p><h2 id="category-heading">Shop by category</h2></div>
        <nav className="category-grid" aria-label="Product categories">
          {CATEGORIES.map((category, index) => (
            <Link key={category} href={`/shop?category=${encodeURIComponent(category)}`}>
              <ResponsiveImage src={CATEGORY_IMAGES[category]} alt="" loading="lazy" decoding="async" />
              <span>0{index + 1}</span><div><strong>{category}</strong><small>Explore collection</small></div><ArrowRight />
            </Link>
          ))}
        </nav>
      </section>

      <section className="lookbook-section" aria-labelledby="lookbook-heading">
        <div className="lookbook-heading"><div><p className="eyebrow">The in-store edit</p><h2 id="lookbook-heading">New looks from KATHA.</h2></div><p>Real styles, photographed inside our Ranasan store.</p></div>
        <div className="lookbook-grid">
          {LOOKBOOK.map(([image, alt], index) => <figure key={image} className={index === 0 || index === 5 ? "lookbook-feature" : ""}><ResponsiveImage src={image} alt={alt} loading="lazy" decoding="async" /><figcaption><span>0{index + 1}</span>{alt}</figcaption></figure>)}
        </div>
      </section>

      <section className="trust-strip" aria-label="Shopping benefits">
        <article><Truck /><div><strong>Shipping across India</strong><span>Delivery across India</span></div></article>
        <article><LockKeyhole /><div><strong>Guest checkout</strong><span>Cash on delivery</span></div></article>
        <article><BadgeIndianRupee /><div><strong>Best price</strong><span>Guaranteed value</span></div></article>
        <article><Gift /><div><strong>Handcrafted with love</strong><span>Curated by KATHA</span></div></article>
      </section>

      <section className="products-section" id="new-in">
        <div className="section-heading">
          <div><p className="eyebrow">Just arrived</p><h2>New arrivals</h2></div>
          <p className="section-note">Open a style to choose your size.</p>
        </div>
        <HomeProducts products={catalog.products} />
      </section>

      <section className="collection-editorial" id="festive">
        <div className="collection-image collection-image-story"><ResponsiveImage src="/images/katha-hero-instagram-4k.jpg" alt="KATHA editorial with the signature pink trunk" loading="lazy" decoding="async" /></div>
        <div className="collection-copy">
          <p className="eyebrow">The festive edit</p><h2>Quiet luxury,<br /><em>rooted in craft.</em></h2>
          <p>Soft ivories, deep celebratory hues and effortless silhouettes designed for intimate rituals and grand evenings.</p>
          <Link href="#new-in" className="dark-button">Explore collection <ArrowRight /></Link>
        </div>
        <div className="collection-image portrait-two"><ResponsiveImage src="/images/katha-blue-set-4k.jpg" alt="Blue festive ethnic set from KATHA" loading="lazy" decoding="async" /></div>
      </section>

      <section className="story-section" id="story">
        <div className="story-copy">
          <p className="eyebrow">Our story</p><h2>Every outfit holds<br />a little <em>katha.</em></h2>
          <p>{settings.aboutShop}</p>
        </div>
      </section>

      <section className="social-section" aria-labelledby="social-heading">
        <div className="social-heading">
          <div><p className="eyebrow">From the KATHA journal</p><h2 id="social-heading">Follow the story</h2></div>
          <a className="instagram-handle" href={settings.instagramUrl} target="_blank" rel="noreferrer">
            <Camera /> @katha_ethnic_wear <ExternalLink />
          </a>
        </div>
        <div className="instagram-showcase">
          <a className="instagram-image instagram-image-large" href="https://www.instagram.com/reel/DU8ahXKkbjU/" target="_blank" rel="noreferrer" aria-label="View the KATHA pink trunk story on Instagram">
            <ResponsiveImage src="/images/katha-trunk-story-4k.jpg" alt="KATHA signature pink trunk behind the scenes" loading="lazy" decoding="async" />
          </a>
          <div className="instagram-copy">
            <Camera aria-hidden="true" />
            <p className="eyebrow">@katha_ethnic_wear</p>
            <h3>New stories,<br />styled every day.</h3>
            <p>Discover fresh arrivals, festive styling ideas and a closer look at the details behind every KATHA piece.</p>
            <a className="dark-button" href={settings.instagramUrl} target="_blank" rel="noreferrer">Open Instagram <ExternalLink /></a>
          </div>
          <a className="instagram-image" href="https://www.instagram.com/reel/Dcd3YUnt2b6/" target="_blank" rel="noreferrer" aria-label="See inside the KATHA store on Instagram">
            <ResponsiveImage src="/images/katha-store-story-4k.jpg" alt="Inside the KATHA store in Ranasan" loading="lazy" decoding="async" />
          </a>
        </div>
      </section>

      <section className="visit-section" id="visit" aria-labelledby="visit-heading">
        <div className="visit-content">
          <p className="eyebrow">Visit KATHA</p>
          <h2 id="visit-heading">See the collection<br />in person.</h2>
          <p className="visit-location"><MapPin /> KATHA ETHNIC · Ranasan</p>
          <address className="visit-address">{settings.address}</address>
          <p className="visit-note">{settings.timings}</p>
          <div className="visit-actions">
            <a className="dark-button" href={settings.mapsUrl} target="_blank" rel="noreferrer">Get directions <MapPin /></a>
            <a className="contact-link" href={"https://wa.me/"+settings.whatsapp} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp us</a>
            <a className="contact-link" href={"tel:"+settings.phone}><Phone /> {settings.phone}</a>
          </div>
        </div>
      </section>

      <StoreFooter />
    </main>
  );
}
