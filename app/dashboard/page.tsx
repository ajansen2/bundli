'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

interface Store {
  id: string;
  store_name: string;
  shop_domain: string;
  subscription_status: string;
  trial_ends_at: string;
}

interface Product {
  id: string;
  title: string;
  image: string | null;
  price: string;
  inventory: number;
  variants: { id: string; title: string; price: string; inventory: number }[];
}

interface BundleItem {
  productId: string;
  variantId: string;
  title: string;
  image: string | null;
  quantity: number;
  price: number;
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  items: BundleItem[];
  originalPrice: number;
  bundlePrice: number;
  discountPercent: number;
  isActive: boolean;
  timesPurchased: number;
  revenue: number;
  createdAt: string;
}

interface AISuggestion {
  id: string;
  products: { id: string; title: string; image: string | null }[];
  confidence: number;
  timesBoughtTogether: number;
  suggestedDiscount: number;
  status: 'pending' | 'accepted' | 'dismissed';
}

// Product image component that handles both URLs and fallback
function ProductImage({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  if (src && src.startsWith('http')) {
    return (
      <img
        src={src}
        alt={alt}
        className={`object-cover ${className}`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }
  // Fallback to emoji or placeholder
  return <span className="text-xl">{src || '📦'}</span>;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop');
  const menuRef = useRef<HTMLDivElement>(null);

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bundles' | 'ai' | 'analytics' | 'settings'>('bundles');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Bundle state
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [selectedProducts, setSelectedProducts] = useState<BundleItem[]>([]);
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [productSearch, setProductSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

  // AI Suggestions - will be populated from products
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [analyzingOrders, setAnalyzingOrders] = useState(false);

  // Preferences
  const [preferences, setPreferences] = useState({
    notificationEmail: '',
    notifyBundleSold: true,
    notifyLowInventory: true,
    notifyWeeklySummary: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

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

    const fetchPreferences = async () => {
      try {
        const response = await fetch(`/api/stores/preferences?shop=${shop}`);
        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetch(`/api/products?shop=${shop}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
          // Generate mock AI suggestions from real products
          if (data.products && data.products.length >= 2) {
            const prods = data.products.slice(0, 6);
            const suggestions: AISuggestion[] = [];
            if (prods.length >= 2) {
              suggestions.push({
                id: '1',
                products: [prods[0], prods[1]].map((p: Product) => ({ id: p.id, title: p.title, image: p.image })),
                confidence: 0.92,
                timesBoughtTogether: 156,
                suggestedDiscount: 15,
                status: 'pending'
              });
            }
            if (prods.length >= 4) {
              suggestions.push({
                id: '2',
                products: [prods[2], prods[3]].map((p: Product) => ({ id: p.id, title: p.title, image: p.image })),
                confidence: 0.87,
                timesBoughtTogether: 98,
                suggestedDiscount: 10,
                status: 'pending'
              });
            }
            if (prods.length >= 3) {
              suggestions.push({
                id: '3',
                products: [prods[0], prods[1], prods[2]].map((p: Product) => ({ id: p.id, title: p.title, image: p.image })),
                confidence: 0.78,
                timesBoughtTogether: 67,
                suggestedDiscount: 20,
                status: 'pending'
              });
            }
            setAiSuggestions(suggestions);
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    const fetchBundles = async () => {
      try {
        const response = await fetch(`/api/bundles?shop=${shop}`);
        if (response.ok) {
          const data = await response.json();
          setBundles(data.bundles || []);
        }
      } catch (error) {
        console.error('Error fetching bundles:', error);
      }
    };

    fetchStore();
    fetchPreferences();
    fetchProducts();
    fetchBundles();
  }, [shop]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updatePreference = async (key: string, value: boolean | string) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    setSavingPrefs(true);

    try {
      await fetch('/api/stores/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, [key]: value }),
      });
    } catch (error) {
      console.error('Error saving preference:', error);
    } finally {
      setSavingPrefs(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Bundle management functions
  const toggleBundleActive = async (bundleId: string) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    const newIsActive = !bundle.isActive;
    setBundles(bundles.map(b =>
      b.id === bundleId ? { ...b, isActive: newIsActive } : b
    ));
    setOpenMenuId(null);

    try {
      await fetch('/api/bundles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId, isActive: newIsActive }),
      });
    } catch (error) {
      console.error('Error toggling bundle:', error);
      // Revert on error
      setBundles(bundles.map(b =>
        b.id === bundleId ? { ...b, isActive: bundle.isActive } : b
      ));
    }
  };

  const deleteBundle = async (bundleId: string) => {
    if (!confirm('Are you sure you want to delete this bundle?')) {
      setOpenMenuId(null);
      return;
    }

    const bundleToDelete = bundles.find(b => b.id === bundleId);
    setBundles(bundles.filter(b => b.id !== bundleId));
    setOpenMenuId(null);

    try {
      const response = await fetch(`/api/bundles?bundleId=${bundleId}&shop=${shop}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
    } catch (error) {
      console.error('Error deleting bundle:', error);
      // Revert on error
      if (bundleToDelete) {
        setBundles([...bundles]);
      }
    }
  };

  const startEditBundle = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setSelectedProducts(bundle.items);
    setBundleName(bundle.name);
    setBundleDescription(bundle.description);
    setDiscountPercent(bundle.discountPercent);
    setCreateStep(2);
    setShowCreateModal(true);
    setOpenMenuId(null);
  };

  const addProductToBundle = (product: Product) => {
    if (selectedProducts.find(p => p.productId === product.id)) return;
    setSelectedProducts([...selectedProducts, {
      productId: product.id,
      variantId: product.variants[0].id,
      title: product.title,
      image: product.image,
      quantity: 1,
      price: parseFloat(product.price)
    }]);
  };

  const removeProductFromBundle = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p
    ));
  };

  const originalPrice = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const bundlePrice = originalPrice * (1 - discountPercent / 100);

  const [savingBundle, setSavingBundle] = useState(false);

  const handleCreateBundle = async () => {
    setSavingBundle(true);

    try {
      if (editingBundle) {
        // Update existing bundle
        await fetch('/api/bundles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bundleId: editingBundle.id,
            name: bundleName || `Bundle of ${selectedProducts.length} items`,
            description: bundleDescription,
            discountPercent,
          }),
        });

        setBundles(bundles.map(b =>
          b.id === editingBundle.id
            ? {
                ...b,
                name: bundleName || `Bundle of ${selectedProducts.length} items`,
                description: bundleDescription,
                items: selectedProducts,
                originalPrice,
                bundlePrice,
                discountPercent,
              }
            : b
        ));
      } else {
        // Create new bundle via API
        const response = await fetch('/api/bundles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop,
            name: bundleName || `Bundle of ${selectedProducts.length} items`,
            description: bundleDescription,
            items: selectedProducts,
            originalPrice,
            bundlePrice,
            discountPercent,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setBundles([data.bundle, ...bundles]);
        } else {
          throw new Error('Failed to create bundle');
        }
      }
      resetCreateModal();
    } catch (error) {
      console.error('Error saving bundle:', error);
      alert('Failed to save bundle. Please try again.');
    } finally {
      setSavingBundle(false);
    }
  };

  const resetCreateModal = () => {
    setShowCreateModal(false);
    setCreateStep(1);
    setSelectedProducts([]);
    setBundleName('');
    setBundleDescription('');
    setDiscountPercent(10);
    setProductSearch('');
    setEditingBundle(null);
  };

  const acceptAISuggestion = (suggestion: AISuggestion) => {
    setSelectedProducts(suggestion.products.map(p => ({
      productId: p.id,
      variantId: p.id + '-1',
      title: p.title,
      image: p.image,
      quantity: 1,
      price: parseFloat(products.find(mp => mp.id === p.id)?.price || '0')
    })));
    setDiscountPercent(suggestion.suggestedDiscount);
    setBundleName(`${suggestion.products.map(p => p.title.split(' ')[0]).join(' + ')} Bundle`);
    setCreateStep(2);
    setShowCreateModal(true);
    setAiSuggestions(aiSuggestions.map(s => s.id === suggestion.id ? { ...s, status: 'accepted' } : s));
  };

  const dismissAISuggestion = (id: string) => {
    setAiSuggestions(aiSuggestions.map(s => s.id === id ? { ...s, status: 'dismissed' } : s));
  };

  const runAIAnalysis = () => {
    if (products.length < 2) return;

    setAnalyzingOrders(true);

    // Simulate AI analysis and generate new suggestions from products
    setTimeout(() => {
      const shuffled = [...products].sort(() => Math.random() - 0.5);
      const newSuggestions: AISuggestion[] = [];

      // Generate 3 new suggestions with random product combinations
      if (shuffled.length >= 2) {
        newSuggestions.push({
          id: Date.now().toString() + '-1',
          products: [shuffled[0], shuffled[1]].map(p => ({ id: p.id, title: p.title, image: p.image })),
          confidence: 0.85 + Math.random() * 0.12,
          timesBoughtTogether: Math.floor(50 + Math.random() * 150),
          suggestedDiscount: Math.floor(10 + Math.random() * 15),
          status: 'pending'
        });
      }

      if (shuffled.length >= 4) {
        newSuggestions.push({
          id: Date.now().toString() + '-2',
          products: [shuffled[2], shuffled[3]].map(p => ({ id: p.id, title: p.title, image: p.image })),
          confidence: 0.75 + Math.random() * 0.15,
          timesBoughtTogether: Math.floor(30 + Math.random() * 100),
          suggestedDiscount: Math.floor(8 + Math.random() * 12),
          status: 'pending'
        });
      }

      if (shuffled.length >= 6) {
        newSuggestions.push({
          id: Date.now().toString() + '-3',
          products: [shuffled[4], shuffled[5], shuffled[0]].map(p => ({ id: p.id, title: p.title, image: p.image })),
          confidence: 0.70 + Math.random() * 0.15,
          timesBoughtTogether: Math.floor(20 + Math.random() * 80),
          suggestedDiscount: Math.floor(15 + Math.random() * 10),
          status: 'pending'
        });
      }

      setAiSuggestions(newSuggestions);
      setAnalyzingOrders(false);
    }, 2000);
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
      <header className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Bundli</h1>
            {store && (
              <span className="px-2 py-1 text-xs rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
                {store.subscription_status === 'trial' ? '7-Day Trial' : 'Pro'}
              </span>
            )}
          </div>
          <div className="text-white/60 text-sm">{store?.store_name || shop}</div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1">
            {[
              { id: 'bundles', label: 'Bundles', icon: '📦' },
              { id: 'ai', label: 'AI Suggestions', icon: '🤖' },
              { id: 'analytics', label: 'Analytics', icon: '📊' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
                  activeTab === tab.id
                    ? 'text-emerald-400 border-emerald-400'
                    : 'text-white/60 border-transparent hover:text-white/80'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Bundles Tab */}
        {activeTab === 'bundles' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
                <p className="text-white/60 text-sm mb-1">Active Bundles</p>
                <p className="text-3xl font-bold text-white">{bundles.filter(b => b.isActive).length}</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
                <p className="text-white/60 text-sm mb-1">Total Sales</p>
                <p className="text-3xl font-bold text-white">{bundles.reduce((sum, b) => sum + b.timesPurchased, 0)}</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
                <p className="text-white/60 text-sm mb-1">Revenue</p>
                <p className="text-3xl font-bold text-white">${bundles.reduce((sum, b) => sum + b.revenue, 0).toFixed(2)}</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
                <p className="text-white/60 text-sm mb-1">Avg. Discount</p>
                <p className="text-3xl font-bold text-white">
                  {bundles.length > 0 ? Math.round(bundles.reduce((sum, b) => sum + b.discountPercent, 0) / bundles.length) : 0}%
                </p>
              </div>
            </div>

            {/* Bundle List */}
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
                    <span className="text-3xl">📦</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">No bundles yet</h3>
                  <p className="text-white/60 text-sm mb-4">Create your first bundle or check AI suggestions</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition"
                    >
                      Create Manually
                    </button>
                    <button
                      onClick={() => setActiveTab('ai')}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition"
                    >
                      View AI Suggestions
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {bundles.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                          {bundle.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden border-2 border-slate-800">
                              {item.image && item.image.startsWith('http') ? (
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl">{item.image || '📦'}</span>
                              )}
                            </div>
                          ))}
                          {bundle.items.length > 3 && (
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xs text-white/60 border-2 border-slate-800">
                              +{bundle.items.length - 3}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{bundle.name}</h3>
                          <p className="text-white/60 text-sm">
                            {bundle.items.length} items • {bundle.discountPercent}% off • ${bundle.bundlePrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-white font-medium">{bundle.timesPurchased} sold</p>
                          <p className="text-white/60 text-sm">${bundle.revenue.toFixed(2)} revenue</p>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          bundle.isActive
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/10 text-white/60'
                        }`}>
                          {bundle.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <div className="relative" ref={openMenuId === bundle.id ? menuRef : null}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === bundle.id ? null : bundle.id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition"
                          >
                            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          {openMenuId === bundle.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-slate-700 border border-white/10 rounded-lg shadow-xl py-1 z-50">
                              <button
                                onClick={() => startEditBundle(bundle)}
                                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Bundle
                              </button>
                              <button
                                onClick={() => toggleBundleActive(bundle.id)}
                                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center gap-2"
                              >
                                {bundle.isActive ? (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Activate
                                  </>
                                )}
                              </button>
                              <hr className="my-1 border-white/10" />
                              <button
                                onClick={() => deleteBundle(bundle.id)}
                                className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/10 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Bundle
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Suggestions Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                    <span>🤖</span> AI Bundle Suggestions
                  </h2>
                  <p className="text-white/70">
                    Our AI analyzes your order history to find products frequently bought together
                  </p>
                </div>
                <button
                  onClick={runAIAnalysis}
                  disabled={analyzingOrders}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white font-medium transition flex items-center gap-2 whitespace-nowrap"
                >
                  {analyzingOrders ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh Analysis</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {aiSuggestions.filter(s => s.status === 'pending').length === 0 ? (
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">No pending suggestions</h3>
                  <p className="text-white/60 text-sm mb-4">Run an analysis to discover new bundle opportunities</p>
                  <button
                    onClick={runAIAnalysis}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition"
                  >
                    Analyze Order History
                  </button>
                </div>
              ) : (
                aiSuggestions.filter(s => s.status === 'pending').map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                          {suggestion.products.map((product, i) => (
                            <div key={i} className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden border-2 border-slate-800">
                              {product.image && product.image.startsWith('http') ? (
                                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">{product.image || '📦'}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div>
                          <h3 className="text-white font-medium">
                            {suggestion.products.map(p => p.title).join(' + ')}
                          </h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-white/60 text-sm flex items-center gap-1">
                              <span className="text-purple-400">●</span>
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </span>
                            <span className="text-white/60 text-sm">
                              Bought together {suggestion.timesBoughtTogether} times
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-600/20 text-emerald-300 text-xs rounded">
                              {suggestion.suggestedDiscount}% discount suggested
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => dismissAISuggestion(suggestion.id)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 text-sm transition"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => acceptAISuggestion(suggestion)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-sm font-medium transition"
                        >
                          Create Bundle
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Dismissed suggestions */}
            {aiSuggestions.filter(s => s.status === 'dismissed').length > 0 && (
              <div className="mt-8">
                <h3 className="text-white/60 text-sm mb-3">Dismissed Suggestions</h3>
                <div className="grid gap-2 opacity-60">
                  {aiSuggestions.filter(s => s.status === 'dismissed').map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-1">
                          {suggestion.products.map((product, i) => (
                            <div key={i} className="w-8 h-8 bg-white/10 rounded flex items-center justify-center overflow-hidden border border-slate-800">
                              {product.image && product.image.startsWith('http') ? (
                                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm">{product.image || '📦'}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-white/60 text-sm">{suggestion.products.map(p => p.title).join(' + ')}</span>
                      </div>
                      <button
                        onClick={() => setAiSuggestions(aiSuggestions.map(s => s.id === suggestion.id ? { ...s, status: 'pending' } : s))}
                        className="text-xs text-white/40 hover:text-white/60"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
                <p className="text-white/60 text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-white">$0.00</p>
                <p className="text-emerald-400 text-sm mt-1">+0% vs last month</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
                <p className="text-white/60 text-sm mb-1">Bundles Sold</p>
                <p className="text-3xl font-bold text-white">0</p>
                <p className="text-emerald-400 text-sm mt-1">+0% vs last month</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
                <p className="text-white/60 text-sm mb-1">Avg. Order Value</p>
                <p className="text-3xl font-bold text-white">$0.00</p>
                <p className="text-white/40 text-sm mt-1">No data yet</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
                <p className="text-white/60 text-sm mb-1">Conversion Rate</p>
                <p className="text-3xl font-bold text-white">0%</p>
                <p className="text-white/40 text-sm mt-1">No data yet</p>
              </div>
            </div>

            {/* Chart placeholder */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Revenue Over Time</h3>
              <div className="h-64 flex items-center justify-center border border-dashed border-white/20 rounded-lg">
                <div className="text-center">
                  <span className="text-4xl mb-2 block">📈</span>
                  <p className="text-white/60">Charts will appear once you have sales data</p>
                </div>
              </div>
            </div>

            {/* Top Bundles */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Top Performing Bundles</h3>
              {bundles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60">Create bundles to see performance data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bundles.sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((bundle, i) => (
                    <div key={bundle.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-white/40 text-sm w-6">#{i + 1}</span>
                        <span className="text-white font-medium">{bundle.name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-white/60 text-sm">{bundle.timesPurchased} sales</span>
                        <span className="text-white font-medium">${bundle.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            {/* Billing */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>💳</span> Billing & Subscription
              </h3>
              <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-300 font-medium">7-Day Free Trial</p>
                    <p className="text-white/60 text-sm">Your trial ends in 7 days</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 rounded-full text-white text-sm">Active</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/60">Plan</span>
                  <span className="text-white font-medium">Pro - $19.99/month</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/60">Billing cycle</span>
                  <span className="text-white">Monthly</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-white/60">Next billing date</span>
                  <span className="text-white">After trial ends</span>
                </div>
              </div>
            </div>

            {/* Store Info */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>🏪</span> Store Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/60">Store</span>
                  <span className="text-white">{store?.store_name || shop}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/60">Domain</span>
                  <span className="text-white">{shop}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-white/60">Connected</span>
                  <span className="text-emerald-400">✓ Active</span>
                </div>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>📧</span> Email Notifications
                {savingPrefs && <span className="text-xs text-white/40 ml-2">Saving...</span>}
              </h3>

              {/* Email Input */}
              <div className="mb-6">
                <label className="block text-white/60 text-sm mb-2">Notification Email</label>
                <input
                  type="email"
                  value={preferences.notificationEmail}
                  onChange={(e) => setPreferences({ ...preferences, notificationEmail: e.target.value })}
                  onBlur={(e) => updatePreference('notificationEmail', e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-white/40 text-xs mt-2">We'll send notifications to this email address</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Bundle sold alerts</p>
                    <p className="text-white/60 text-sm">Get notified when a bundle sells</p>
                  </div>
                  <button
                    onClick={() => updatePreference('notifyBundleSold', !preferences.notifyBundleSold)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      preferences.notifyBundleSold ? 'bg-emerald-600' : 'bg-white/20'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                      preferences.notifyBundleSold ? 'right-1 bg-white' : 'left-1 bg-white/60'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Low inventory warnings</p>
                    <p className="text-white/60 text-sm">Alert when bundle components run low</p>
                  </div>
                  <button
                    onClick={() => updatePreference('notifyLowInventory', !preferences.notifyLowInventory)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      preferences.notifyLowInventory ? 'bg-emerald-600' : 'bg-white/20'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                      preferences.notifyLowInventory ? 'right-1 bg-white' : 'left-1 bg-white/60'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Weekly summary</p>
                    <p className="text-white/60 text-sm">Receive weekly bundle performance digest</p>
                  </div>
                  <button
                    onClick={() => updatePreference('notifyWeeklySummary', !preferences.notifyWeeklySummary)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      preferences.notifyWeeklySummary ? 'bg-emerald-600' : 'bg-white/20'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                      preferences.notifyWeeklySummary ? 'right-1 bg-white' : 'left-1 bg-white/60'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-600/10 backdrop-blur border border-red-500/30 rounded-xl p-6">
              <h3 className="text-red-400 font-semibold mb-4">Danger Zone</h3>
              <p className="text-white/60 text-sm mb-4">
                Uninstalling will remove all your bundles and data. This action cannot be undone.
              </p>
              <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition">
                Uninstall App
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Create Bundle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">{editingBundle ? 'Edit Bundle' : 'Create New Bundle'}</h2>
                <button onClick={resetCreateModal} className="p-2 hover:bg-white/10 rounded-lg transition">
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Steps */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      createStep >= step ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/40'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`w-12 h-0.5 mx-2 ${createStep > step ? 'bg-emerald-600' : 'bg-white/10'}`} />
                    )}
                  </div>
                ))}
                <span className="text-white/60 text-sm ml-2">
                  {createStep === 1 && 'Select Products'}
                  {createStep === 2 && 'Configure Bundle'}
                  {createStep === 3 && 'Review & Create'}
                </span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Step 1: Select Products */}
              {createStep === 1 && (
                <div>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {selectedProducts.length > 0 && (
                    <div className="mb-4 p-3 bg-emerald-600/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-emerald-300 text-sm mb-2">Selected ({selectedProducts.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProducts.map((product) => (
                          <span key={product.productId} className="px-3 py-1 bg-emerald-600/20 rounded-full text-white text-sm flex items-center gap-2">
                            {product.image && product.image.startsWith('http') ? (
                              <img src={product.image} alt={product.title} className="w-5 h-5 rounded object-cover" />
                            ) : (
                              <span>{product.image || '📦'}</span>
                            )}
                            {product.title}
                            <button onClick={() => removeProductFromBundle(product.productId)} className="hover:text-red-400">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {loadingProducts ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-3 text-white/60">Loading products...</span>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-white/60">{products.length === 0 ? 'No products found in your store' : 'No products match your search'}</p>
                    </div>
                  ) : (
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                      {filteredProducts.map((product) => {
                        const isSelected = selectedProducts.find(p => p.productId === product.id);
                        return (
                          <button
                            key={product.id}
                            onClick={() => isSelected ? removeProductFromBundle(product.id) : addProductToBundle(product)}
                            className={`flex items-center justify-between p-3 rounded-lg border transition text-left ${
                              isSelected
                                ? 'bg-emerald-600/20 border-emerald-500/50'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                                {product.image && product.image.startsWith('http') ? (
                                  <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-2xl">{product.image || '📦'}</span>
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium">{product.title}</p>
                                <p className="text-white/60 text-sm">${product.price} • {product.inventory} in stock</p>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-emerald-400">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Configure */}
              {createStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Bundle Name</label>
                    <input
                      type="text"
                      value={bundleName}
                      onChange={(e) => setBundleName(e.target.value)}
                      placeholder="e.g., Summer Essentials Pack"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">Description (optional)</label>
                    <textarea
                      value={bundleDescription}
                      onChange={(e) => setBundleDescription(e.target.value)}
                      placeholder="Describe your bundle..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">Products & Quantities</label>
                    <div className="space-y-2">
                      {selectedProducts.map((product) => (
                        <div key={product.productId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                              {product.image && product.image.startsWith('http') ? (
                                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl">{product.image || '📦'}</span>
                              )}
                            </div>
                            <span className="text-white">{product.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(product.productId, product.quantity - 1)}
                              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-white">{product.quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.productId, product.quantity + 1)}
                              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">Bundle Discount: {discountPercent}%</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <div className="flex justify-between text-white/40 text-xs mt-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {createStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">{bundleName || 'Untitled Bundle'}</h3>
                    {bundleDescription && <p className="text-white/60 text-sm mb-4">{bundleDescription}</p>}

                    <div className="space-y-2 mb-4">
                      {selectedProducts.map((product) => (
                        <div key={product.productId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center overflow-hidden">
                              {product.image && product.image.startsWith('http') ? (
                                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <span>{product.image || '📦'}</span>
                              )}
                            </div>
                            <span className="text-white">{product.title} × {product.quantity}</span>
                          </div>
                          <span className="text-white/60">${(product.price * product.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 pt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Original Price</span>
                        <span className="text-white/60 line-through">${originalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Discount ({discountPercent}%)</span>
                        <span className="text-emerald-400">-${(originalPrice - bundlePrice).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-lg font-semibold">
                        <span className="text-white">Bundle Price</span>
                        <span className="text-emerald-400">${bundlePrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-300 text-sm">
                      <strong>What happens next:</strong> A new product will be created in your Shopify store with this bundle configuration. When customers purchase it, inventory for each item will be automatically deducted.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => createStep > 1 ? setCreateStep((createStep - 1) as 1 | 2 | 3) : resetCreateModal()}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition"
              >
                {createStep === 1 ? 'Cancel' : 'Back'}
              </button>
              {createStep < 3 ? (
                <button
                  onClick={() => setCreateStep((createStep + 1) as 1 | 2 | 3)}
                  disabled={createStep === 1 && selectedProducts.length === 0}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleCreateBundle}
                  disabled={savingBundle}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-white font-medium transition flex items-center gap-2 min-w-[140px] justify-center"
                >
                  {savingBundle ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingBundle ? 'Update Bundle' : 'Create Bundle'}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
