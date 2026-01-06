-- Bundle Manager Database Schema

CREATE TABLE IF NOT EXISTS bundle_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_domain TEXT UNIQUE NOT NULL,
  shopify_store_id TEXT,
  store_name TEXT,
  email TEXT,
  access_token TEXT NOT NULL,
  subscription_status TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES bundle_stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shopify_product_id TEXT,
  price DECIMAL(10,2),
  discount_percent INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bundle_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  shopify_product_id TEXT NOT NULL,
  shopify_variant_id TEXT,
  product_title TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bundle_stores_shop_domain ON bundle_stores(shop_domain);
CREATE INDEX IF NOT EXISTS idx_bundles_store_id ON bundles(store_id);
CREATE INDEX IF NOT EXISTS idx_bundles_shopify_product_id ON bundles(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle_id ON bundle_items(bundle_id);

ALTER TABLE bundle_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access bundle_stores" ON bundle_stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access bundles" ON bundles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access bundle_items" ON bundle_items FOR ALL USING (true) WITH CHECK (true);
