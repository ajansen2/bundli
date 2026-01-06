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
  title: "Bundle Manager - Product Bundles & Packs for Shopify",
  description: "Create product bundles and multi-packs that automatically deduct inventory. Sell packs of 4, 6, 12 with smart inventory sync.",
  keywords: "shopify bundles, product packs, inventory management, shopify app, bundle discounts, multi-pack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '';

  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        <meta name="shopify-api-key" content={apiKey} />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            if (window.self === window.top) return;
            var retryCount = 0;
            function initializeAppBridge() {
              if (window.shopify && window.shopify.createApp) {
                try {
                  var urlParams = new URLSearchParams(window.location.search);
                  var host = urlParams.get('host');
                  var shop = urlParams.get('shop');
                  if (host && shop) {
                    window.shopifyApp = window.shopify.createApp({
                      apiKey: '${apiKey}',
                      host: host,
                      forceRedirect: false
                    });
                  }
                } catch (error) {
                  console.error('Failed to initialize App Bridge:', error);
                }
              } else if (retryCount++ < 50) {
                setTimeout(initializeAppBridge, 100);
              }
            }
            initializeAppBridge();
          })();
        `}} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
