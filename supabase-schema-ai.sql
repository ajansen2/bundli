-- Bundle Manager AI - Enhanced Database Schema
-- Run this in Supabase SQL Editor

-- =============================================
-- STORES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_domain TEXT UNIQUE NOT NULL,
  shopify_store_id TEXT,
  store_name TEXT,
  email TEXT,
  access_token TEXT NOT NULL,
  subscription_status TEXT DEFAULT 'trial',
  subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  plan TEXT DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BUNDLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  shopify_product_id TEXT,
  shopify_variant_id TEXT,
  original_price DECIMAL(10,2),
  bundle_price DECIMAL(10,2),
  discount_percent INTEGER DEFAULT 0,
  discount_type TEXT DEFAULT 'percent', -- 'percent' or 'fixed'
  is_active BOOLEAN DEFAULT true,
  is_ai_suggested BOOLEAN DEFAULT false,
  display_type TEXT DEFAULT 'product', -- 'product', 'cart_upsell', 'checkout'
  times_purchased INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BUNDLE ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bundle_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  shopify_product_id TEXT NOT NULL,
  shopify_variant_id TEXT,
  product_title TEXT,
  product_image_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_creation DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AI SUGGESTIONS TABLE (Frequently Bought Together)
-- =============================================
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  product_ids TEXT[] NOT NULL, -- Array of product IDs in the suggestion
  product_titles TEXT[], -- Array of product titles
  confidence_score DECIMAL(3,2) DEFAULT 0, -- 0.00 to 1.00
  times_bought_together INTEGER DEFAULT 0,
  suggested_discount INTEGER DEFAULT 10,
  suggested_price DECIMAL(10,2),
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed'
  bundle_id UUID REFERENCES bundles(id) ON DELETE SET NULL, -- If converted to bundle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER HISTORY (for AI analysis)
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  shopify_order_id TEXT NOT NULL,
  shopify_product_id TEXT NOT NULL,
  shopify_variant_id TEXT,
  product_title TEXT,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10,2),
  order_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BUNDLE ANALYTICS
-- =============================================
CREATE TABLE IF NOT EXISTS bundle_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  add_to_carts INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bundle_id, date)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_stores_shop_domain ON stores(shop_domain);
CREATE INDEX IF NOT EXISTS idx_bundles_store_id ON bundles(store_id);
CREATE INDEX IF NOT EXISTS idx_bundles_shopify_product_id ON bundles(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle_id ON bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_store_id ON ai_suggestions(store_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_order_items_store_id ON order_items(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_shopify_order_id ON order_items(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_shopify_product_id ON order_items(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_bundle_analytics_bundle_id ON bundle_analytics(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_analytics_date ON bundle_analytics(date);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_analytics ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access stores" ON stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access bundles" ON bundles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access bundle_items" ON bundle_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ai_suggestions" ON ai_suggestions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access bundle_analytics" ON bundle_analytics FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get frequently bought together products
CREATE OR REPLACE FUNCTION get_frequently_bought_together(
  p_store_id UUID,
  p_min_occurrences INTEGER DEFAULT 3
)
RETURNS TABLE (
  product_ids TEXT[],
  occurrences BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH order_products AS (
    SELECT
      shopify_order_id,
      ARRAY_AGG(DISTINCT shopify_product_id ORDER BY shopify_product_id) as products
    FROM order_items
    WHERE store_id = p_store_id
    GROUP BY shopify_order_id
    HAVING COUNT(DISTINCT shopify_product_id) >= 2
  ),
  product_pairs AS (
    SELECT
      ARRAY[products[i], products[j]] as pair
    FROM order_products,
    LATERAL generate_series(1, array_length(products, 1) - 1) as i,
    LATERAL generate_series(i + 1, array_length(products, 1)) as j
    WHERE array_length(products, 1) >= 2
  )
  SELECT
    pair as product_ids,
    COUNT(*) as occurrences
  FROM product_pairs
  GROUP BY pair
  HAVING COUNT(*) >= p_min_occurrences
  ORDER BY COUNT(*) DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SAMPLE DATA (for testing)
-- =============================================
-- Uncomment to add test data:
-- INSERT INTO stores (shop_domain, store_name, email, access_token)
-- VALUES ('test-store.myshopify.com', 'Test Store', 'test@example.com', 'test_token');
