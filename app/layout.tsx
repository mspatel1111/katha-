import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "./store-provider";
import { LazyCart } from "./lazy-cart";

export const metadata: Metadata = {
  metadataBase:new URL("https://katha-ethnic-wear.yashpatel9724945.chatgpt.site"),
  title: "KATHA Ethnic Wear | Modern Indian Clothing",
  description:
    "Discover KATHA's thoughtfully curated ethnic wear — elegant kurta sets, festive dresses and timeless Indian silhouettes.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body className="antialiased"><StoreProvider>{children}<LazyCart /></StoreProvider></body>
    </html>
  );
}
