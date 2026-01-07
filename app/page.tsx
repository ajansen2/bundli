'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function HomeContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');

  useEffect(() => {
    if (shop) {
      // Always go through OAuth to ensure we have a valid token
      window.location.href = `/api/auth/shopify?shop=${shop}`;
    }
  }, [shop]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Bundle <span className="text-emerald-400">Manager</span>
          </h1>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Create product bundles and multi-packs with automatic inventory deduction.
            Sell packs of 4, 6, or 12 - inventory syncs perfectly every time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="https://apps.shopify.com/bundle-manager"
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-lg transition"
            >
              Install from Shopify App Store
            </a>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Bundles</h3>
              <p className="text-white/60">
                Create bundles that automatically deduct the right inventory for each component product.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Multi-Pack Pricing</h3>
              <p className="text-white/60">
                Set pack sizes (4, 6, 12+) with automatic price calculations and bulk discounts.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-Time Sync</h3>
              <p className="text-white/60">
                Inventory updates instantly when bundles sell. Never oversell again.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-white mb-8">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">1</div>
                <h3 className="text-white font-semibold mb-2">Select Products</h3>
                <p className="text-white/60 text-sm">Choose the products you want to bundle together</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">2</div>
                <h3 className="text-white font-semibold mb-2">Set Quantities</h3>
                <p className="text-white/60 text-sm">Define how many of each item in the bundle</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">3</div>
                <h3 className="text-white font-semibold mb-2">Sell & Sync</h3>
                <p className="text-white/60 text-sm">Bundle sells, inventory auto-deducts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-white/40 text-sm">
          <p>&copy; 2024 Bundle Manager. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="/privacy" className="hover:text-white/60">Privacy Policy</a>
            <a href="/terms" className="hover:text-white/60">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
