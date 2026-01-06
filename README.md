# Bundle Manager

Create product bundles and multi-packs with automatic inventory deduction. Sell packs of 4, 6, 12 with smart inventory sync.

**Price:** $19.99/month (7-day free trial)

---

## Complete Setup Guide

### Step 1: Supabase Database Setup

1. Go to https://supabase.com and sign in
2. Click **New Project** (or use existing project)
3. Choose organization, name it `bundlemanager`, set a password
4. Wait for project to be created (~2 minutes)
5. Go to **SQL Editor** (left sidebar)
6. Click **New Query**
7. Copy and paste this SQL:

```sql
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
```

8. Click **Run** (or Cmd+Enter)
9. Go to **Project Settings** → **API**
10. Copy these values (you'll need them later):
    - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
    - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

### Step 2: Shopify Partner App Setup

1. Go to https://partners.shopify.com
2. Click **Apps** in sidebar
3. Click **Create App** → **Create app manually**
4. Enter:
   - App name: `Bundle Manager`
   - App URL: `https://bundlemanager.vercel.app` (we'll create this next)
5. Click **Create**
6. You'll see your **Client ID** and **Client Secret** - copy these!
7. Go to **Configuration** tab and set:

**URLs:**
- App URL: `https://bundlemanager.vercel.app`
- Allowed redirection URL(s): `https://bundlemanager.vercel.app/api/auth/shopify/callback`

**GDPR webhooks:**
- Customer data request: `https://bundlemanager.vercel.app/api/webhooks/compliance`
- Customer data erasure: `https://bundlemanager.vercel.app/api/webhooks/compliance`
- Shop data erasure: `https://bundlemanager.vercel.app/api/webhooks/compliance`

**App settings:**
- Check "Embed in Shopify admin"

8. Click **Save**

---

### Step 3: GitHub Repository

1. Go to https://github.com/new
2. Repository name: `bundlemanager`
3. Make it **Private**
4. Click **Create repository**
5. In your terminal, run:

```bash
cd /Users/adam/bundlemanager
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bundlemanager.git
git push -u origin main
```

---

### Step 4: Vercel Deployment

1. Go to https://vercel.com
2. Click **Add New** → **Project**
3. Import your `bundlemanager` GitHub repo
4. Before deploying, click **Environment Variables**
5. Add these variables:

| Variable | Value |
|----------|-------|
| `SHOPIFY_API_KEY` | Your Client ID from Shopify Partners |
| `SHOPIFY_API_SECRET` | Your Client Secret from Shopify Partners |
| `SHOPIFY_SCOPES` | `read_products,write_products,read_inventory,write_inventory` |
| `NEXT_PUBLIC_SHOPIFY_API_KEY` | Same as SHOPIFY_API_KEY |
| `NEXT_PUBLIC_APP_URL` | `https://bundlemanager.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key |

6. Click **Deploy**
7. Wait for deployment (~2 minutes)
8. Your app is now live at `https://bundlemanager.vercel.app`

**Note:** If you want a custom domain like `bundlemanager.com`:
- Go to Vercel Project → Settings → Domains
- Add your domain and follow DNS instructions

---

### Step 5: Test Your App

1. Go to Shopify Partners → Apps → Bundle Manager
2. Click **Test on development store**
3. Select your development store
4. You should see the OAuth flow and billing screen
5. Approve the app and billing
6. You should land on the dashboard!
7. Try creating a test bundle

---

### Step 6: Submit to Shopify App Store

1. In Shopify Partners → Apps → Bundle Manager
2. Click **Distribution** tab
3. Select **Public distribution**
4. Fill out the listing:

**App listing:**
- Name: Bundle Manager
- Tagline: Product bundles with automatic inventory sync
- Description: (write 2-3 paragraphs about the app)
- Category: Store management → Inventory management

**Screenshots needed:**
- Dashboard with bundle list
- Create bundle modal
- Bundle with items configured

**Contact info:**
- Support email
- Privacy policy URL: `https://bundlemanager.vercel.app/privacy`
- FAQ URL (optional)

5. Click **Submit for review**
6. Wait 5-7 business days for Shopify review

---

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
# Then edit .env.local with your credentials

# Run dev server
npm run dev

# Opens at http://localhost:3000
```

---

## Project Structure

```
bundlemanager/
├── app/
│   ├── api/
│   │   ├── auth/shopify/         # OAuth flow
│   │   │   ├── route.ts          # Start OAuth
│   │   │   └── callback/route.ts # OAuth callback
│   │   ├── billing/callback/     # Billing activation
│   │   ├── bundles/              # Bundle CRUD
│   │   ├── stores/lookup/        # Store data
│   │   ├── health/               # Health check
│   │   └── webhooks/
│   │       ├── uninstall/        # App uninstall
│   │       ├── compliance/       # GDPR webhooks
│   │       └── orders/           # Order webhook for inventory
│   ├── dashboard/page.tsx        # Bundle creator UI
│   ├── privacy/page.tsx          # Privacy policy
│   ├── terms/page.tsx            # Terms of service
│   ├── layout.tsx                # App Bridge setup
│   └── page.tsx                  # Landing page
├── supabase-schema.sql           # Database schema
├── .env.example                  # Example env vars
├── package.json
└── README.md
```

---

## How It Works

1. **Create Bundle** - Select products, set quantities (4-pack, 6-pack, etc.)
2. **Set Discount** - Apply 0-30% bundle discount
3. **Customer Buys** - Bundle appears as a product in your store
4. **Auto Inventory** - When bundle sells, component inventory deducts automatically via order webhook

---

## Features

- **Pack Sizes:** 4, 6, 8, 12+ items per bundle
- **Bundle Discounts:** 0-30% off bundle price
- **Real-Time Sync:** Inventory updates when bundles sell
- **Order Webhook:** Automatic inventory deduction
- **Analytics:** Track bundle sales and revenue

---

## Troubleshooting

**"Invalid HMAC" error:**
- Double-check your `SHOPIFY_API_SECRET` in Vercel matches Shopify Partners

**"Store not found" error:**
- Make sure Supabase tables were created
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct

**App not loading in Shopify admin:**
- Verify `NEXT_PUBLIC_SHOPIFY_API_KEY` matches your Client ID
- Check "Embed in Shopify admin" is enabled in app settings

**Inventory not syncing:**
- Verify the orders webhook is registered
- Check Vercel logs for webhook errors

**Billing not working:**
- For development stores, billing is in test mode automatically
- Real charges only happen on live stores

---

## Support

- Email: support@bundlemanager.com
- Create an issue on GitHub
