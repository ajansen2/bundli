export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-900 py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-white/70 mb-6">Last updated: December 2024</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-white/70 mb-4">
            By installing Bundle Manager, you agree to these Terms of Service.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Service Description</h2>
          <p className="text-white/70 mb-4">
            Bundle Manager allows you to create product bundles with automatic inventory deduction.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Pricing</h2>
          <p className="text-white/70 mb-4">
            Bundle Manager costs $19.99/month with a 7-day free trial. Cancel anytime through Shopify.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Inventory Accuracy</h2>
          <p className="text-white/70 mb-4">
            While we strive for accuracy, always verify inventory counts. We are not liable for inventory discrepancies.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Contact</h2>
          <p className="text-white/70 mb-4">Questions: support@bundlemanager.com</p>
        </div>
        <div className="mt-12">
          <a href="/" className="text-emerald-400 hover:text-emerald-300">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
