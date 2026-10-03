import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";

export function StoreNavigation({ className = "" }: { className?: string }) {
  return (
    <nav className={`store-navigation ${className}`.trim()} aria-label="Primary navigation">
      <Link href="/">Home</Link>
      <details className="category-menu">
        <summary>Categories <ChevronDown aria-hidden="true" /></summary>
        <div className="category-dropdown">
          <Link href="/shop">Shop All</Link>
          {CATEGORIES.map((category) => (
            <Link key={category} href={`/shop?category=${encodeURIComponent(category)}`}>{category}</Link>
          ))}
        </div>
      </details>
      <Link href="/contact">Contact Us</Link>
      <Link href="/track-order">Track Order</Link>
    </nav>
  );
}
