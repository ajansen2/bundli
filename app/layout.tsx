import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bundli - Product Bundles & Packs for Shopify",
  description: "Create product bundles and multi-packs that automatically deduct inventory. Sell packs of 4, 6, 12 with smart inventory sync.",
  keywords: "shopify bundles, product packs, inventory management, shopify app, bundle discounts, multi-pack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "";

  return (
    <html lang="en">
      <head>
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        <meta name="shopify-api-key" content={apiKey} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
