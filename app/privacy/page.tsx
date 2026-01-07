'use client';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/10 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-white/60 mb-8">Last updated: January 6, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
            <p className="text-white/80 leading-relaxed">
              Bundli (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Shopify application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              When you install and use Bundli, we collect the following information:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
              <li>Store information (store name, domain, email)</li>
              <li>Product data (titles, prices, images, inventory)</li>
              <li>Order data (for AI bundle suggestions)</li>
              <li>Bundle configurations you create</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              We use the collected information to:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
              <li>Provide and maintain our bundle creation service</li>
              <li>Generate AI-powered bundle suggestions</li>
              <li>Create bundle products in your Shopify store</li>
              <li>Track bundle performance and analytics</li>
              <li>Send notifications about bundle sales (if enabled)</li>
              <li>Improve our services and develop new features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Storage and Security</h2>
            <p className="text-white/80 leading-relaxed">
              Your data is stored securely using industry-standard encryption and security practices. We use Supabase for database storage, which provides enterprise-grade security. We do not sell, trade, or otherwise transfer your information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
            <p className="text-white/80 leading-relaxed">
              We retain your data for as long as your app is installed. When you uninstall Bundli, we will delete your store data within 30 days, in accordance with Shopify&apos;s requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Shopify Data</h2>
            <p className="text-white/80 leading-relaxed">
              Bundli accesses your Shopify store data through Shopify&apos;s secure OAuth authentication. We only request the minimum permissions necessary to provide our services. We comply with Shopify&apos;s API Terms of Service and Partner Program Agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Uninstall the app at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">GDPR Compliance</h2>
            <p className="text-white/80 leading-relaxed">
              For users in the European Economic Area (EEA), we process data in accordance with GDPR requirements. We handle customer data request and redaction webhooks from Shopify to ensure compliance with data protection regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
            <p className="text-white/80 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="text-white/80 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-emerald-400 mt-2">support@bundli.app</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <a href="/" className="text-emerald-400 hover:text-emerald-300 transition">
            ← Back to Bundli
          </a>
        </div>
      </div>
    </div>
  );
}
