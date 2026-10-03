"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES, DEFAULT_PRODUCTS } from "@/lib/catalog";

export function StoreSearch() {
  const [query, setQuery] = useState("");

  return (
    <form className="store-search" role="search" action="/shop" method="get">
      <label>
        <Search aria-hidden="true" />
        <span className="sr-only">Search KATHA products</span>
        <input
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          list="katha-search-options"
          placeholder="Search KATHA collections…"
          aria-label="Search products and categories"
        />
      </label>
      <datalist id="katha-search-options">
        {CATEGORIES.map((category) => <option key={category} value={category} />)}
        {DEFAULT_PRODUCTS.map((product) => <option key={product.id} value={product.name} />)}
      </datalist>
      <div className="search-options" aria-label="Popular searches">
        {CATEGORIES.map((category) => <Link key={category} href={`/shop?category=${encodeURIComponent(category)}`}>{category}</Link>)}
      </div>
      <button type="submit">Search</button>
    </form>
  );
}
