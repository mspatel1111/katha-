import Link from "next/link";
export default function NotFound() {
  return <main className="state-page"><p className="eyebrow">KATHA</p><h1>Page not found</h1><p>This page or style is no longer available.</p><Link className="dark-button" href="/shop">Explore the collection</Link></main>;
}
