export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-900 py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-white/70 mb-6">Last updated: December 2024</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-white/70 mb-4">Bundle Manager collects:</p>
          <ul className="text-white/70 list-disc pl-6 mb-4 space-y-2">
            <li>Shop domain and store name</li>
            <li>Store owner email address</li>
            <li>Product and inventory data (for bundle management)</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-white/70 mb-4">We use the collected information to:</p>
          <ul className="text-white/70 list-disc pl-6 mb-4 space-y-2">
            <li>Create and manage product bundles</li>
            <li>Sync inventory when bundles are sold</li>
            <li>Process billing through Shopify</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Data Storage</h2>
          <p className="text-white/70 mb-4">
            We store bundle configurations. Product and inventory data remains in your Shopify store.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Contact</h2>
          <p className="text-white/70 mb-4">For privacy questions: privacy@bundlemanager.com</p>
        </div>
        <div className="mt-12">
          <a href="/" className="text-emerald-400 hover:text-emerald-300">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
