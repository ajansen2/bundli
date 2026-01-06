'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Store {
  id: string;
  store_name: string;
  shop_domain: string;
  subscription_tier: string;
}

interface BundleItem {
  id: string;
  productId: string;
  productTitle: string;
  quantity: number;
}

interface Bundle {
  id: string;
  name: string;
  items: BundleItem[];
  price: number;
  discount: number;
  active: boolean;
}

export default function Dashboard() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop');

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBundle, setNewBundle] = useState({
    name: '',
    packSize: 4,
    discount: 10,
  });

  useEffect(() => {
    if (!shop) return;

    const fetchStore = async () => {
      try {
        const response = await fetch(`/api/stores/lookup?shop=${shop}`);
        if (response.ok) {
          const data = await response.json();
          setStore(data.store);
        }
      } catch (error) {
        console.error('Error fetching store:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [shop]);

  const handleCreateBundle = () => {
    // In production, this would create a bundle via API
    const newBundleData: Bundle = {
      id: Date.now().toString(),
      name: newBundle.name || `Pack of ${newBundle.packSize}`,
      items: [],
      price: 0,
      discount: newBundle.discount,
      active: true,
    };
    setBundles([...bundles, newBundleData]);
    setShowCreateModal(false);
    setNewBundle({ name: '', packSize: 4, discount: 10 });
  };

  if (!shop) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Missing shop parameter</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/10 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Bundle Manager</h1>
            {store && (
              <span className="px-2 py-1 text-xs rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
                {store.subscription_tier === 'trial' ? '7-Day Trial' : store.subscription_tier}
              </span>
            )}
          </div>
          <div className="text-white/60 text-sm">{store?.store_name || shop}</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <p className="text-white/60 text-sm mb-1">Active Bundles</p>
            <p className="text-3xl font-bold text-white">{bundles.filter(b => b.active).length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <p className="text-white/60 text-sm mb-1">Bundle Sales (30d)</p>
            <p className="text-3xl font-bold text-white">0</p>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <p className="text-white/60 text-sm mb-1">Revenue from Bundles</p>
            <p className="text-3xl font-bold text-white">$0</p>
          </div>
        </div>

        {/* Bundles Section */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Your Bundles</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Bundle
            </button>
          </div>

          {bundles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">No bundles yet</h3>
              <p className="text-white/60 text-sm mb-4">Create your first bundle to start selling multi-packs</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition"
              >
                Create Your First Bundle
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bundles.map((bundle) => (
                <div
                  key={bundle.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div>
                    <h3 className="text-white font-medium">{bundle.name}</h3>
                    <p className="text-white/60 text-sm">
                      {bundle.items.length} items • {bundle.discount}% discount
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded ${
                      bundle.active
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {bundle.active ? 'Active' : 'Inactive'}
                    </span>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition">
                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">How Bundle Manager Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">1</div>
              <div>
                <h4 className="text-white font-medium mb-1">Create Bundle</h4>
                <p className="text-white/60 text-sm">Select products and set quantities for your bundle</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">2</div>
              <div>
                <h4 className="text-white font-medium mb-1">Customer Buys</h4>
                <p className="text-white/60 text-sm">Bundle appears as a product in your store</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">3</div>
              <div>
                <h4 className="text-white font-medium mb-1">Auto Inventory</h4>
                <p className="text-white/60 text-sm">Component inventory deducts automatically</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Bundle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-white mb-6">Create New Bundle</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Bundle Name</label>
                <input
                  type="text"
                  value={newBundle.name}
                  onChange={(e) => setNewBundle({ ...newBundle, name: e.target.value })}
                  placeholder="e.g., 4-Pack Special"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Pack Size</label>
                <div className="flex gap-2">
                  {[4, 6, 8, 12].map((size) => (
                    <button
                      key={size}
                      onClick={() => setNewBundle({ ...newBundle, packSize: size })}
                      className={`flex-1 py-2 rounded-lg text-sm transition ${
                        newBundle.packSize === size
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {size} Pack
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Bundle Discount: {newBundle.discount}%</label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={newBundle.discount}
                  onChange={(e) => setNewBundle({ ...newBundle, discount: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-white/40 text-xs mt-1">
                  <span>0%</span>
                  <span>30%</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBundle}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition"
              >
                Create Bundle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
