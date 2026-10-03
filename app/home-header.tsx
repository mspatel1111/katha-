"use client";
import Link from "next/link";
import { lazy, Suspense, useRef, useState } from "react";
import { useBag } from "@/app/store-provider";
import { ResponsiveImage } from "@/app/responsive-image";
import { Menu, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreNavigation } from "@/app/store-navigation";
import { StoreSearch } from "@/app/store-search";
import { FavoritesLink } from "@/app/favorites";

const HomeDrawers = lazy(() => import("./home-drawers"));

export function HomeHeader() {
  const [mode, setMode] = useState<"menu" | null>(null);
  const bag = useBag();
  const count = bag.count;
  const menuButton = useRef<HTMLButtonElement>(null);
  const bagButton = useRef<HTMLButtonElement>(null);
  const close = () => {
    const trigger = menuButton.current;
    setMode(null);
    trigger?.focus();
  };
  return <>
    <header className="site-header">
      <div className="mobile-menu">
        <Button ref={menuButton} className="icon-button" variant="ghost" size="icon" aria-label="Open menu" aria-expanded={mode==="menu"} aria-controls={mode?"katha-mobile-menu":undefined} onClick={() => setMode("menu")}><Menu /></Button>
      </div>
      <StoreNavigation className="desktop-nav" />
      <Link href="/" className="logo-link" aria-label="KATHA home"><ResponsiveImage src="/katha-logo.webp" alt="KATHA Ethnic" className="logo-image" width="225" height="54" /></Link>
      <div className="header-actions">
        <FavoritesLink />
        <Button ref={bagButton} className="bag-button" variant="ghost" aria-label={`Shopping bag with ${count} items`} onClick={bag.openBag}><ShoppingBag /><span>Bag</span><span className="bag-count">{count}</span></Button>
      </div>
    </header>
    <StoreSearch />
    {mode && <Suspense fallback={<p className="drawer-loading" role="status">Opening menu…</p>}><HomeDrawers mode={mode} onClose={close} restoreFocus={()=>menuButton.current?.focus()} /></Suspense>}
  </>;
}
