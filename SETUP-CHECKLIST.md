# Bundle Manager AI - Quick Setup Checklist

**App Name:** Bundle Manager AI
**Price:** $19.99/month (7-day free trial)
**Unique Angle:** AI-powered bundle suggestions based on order history

---

## Pre-Setup Checklist

- [ ] Domain purchased (optional): bundlemanager.ai or bundlemanagerai.com
- [ ] Vercel account ready
- [ ] Supabase project created
- [ ] Shopify Partner account ready
- [ ] GitHub repo created: `bundlemanager`

---

## 1. Supabase Setup (5 minutes)

- [ ] Create new Supabase project named `bundlemanager`
- [ ] Run the SQL from `supabase-schema-ai.sql` in SQL Editor
- [ ] Copy these values:
  - [ ] Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] service_role key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Shopify Partner App (10 minutes)

- [ ] Go to partners.shopify.com → Apps → Create App
- [ ] App name: `Bundle Manager AI`
- [ ] Copy Client ID → `SHOPIFY_API_KEY`
- [ ] Copy Client Secret → `SHOPIFY_API_SECRET`

### App Configuration:
- [ ] App URL: `https://YOUR_DOMAIN.vercel.app`
- [ ] Allowed redirect URL: `https://YOUR_DOMAIN.vercel.app/api/auth/shopify/callback`
- [ ] Check "Embed in Shopify admin"

### GDPR Webhooks:
- [ ] Customer data request: `https://YOUR_DOMAIN.vercel.app/api/webhooks/compliance`
- [ ] Customer data erasure: `https://YOUR_DOMAIN.vercel.app/api/webhooks/compliance`
- [ ] Shop data erasure: `https://YOUR_DOMAIN.vercel.app/api/webhooks/compliance`

### API Scopes Needed:
```
read_products,write_products,read_orders,read_inventory,write_inventory
```

---

## 3. Vercel Deployment (5 minutes)

- [ ] Connect GitHub repo to Vercel
- [ ] Add environment variables:

| Variable | Value |
|----------|-------|
| `SHOPIFY_API_KEY` | Client ID |
| `SHOPIFY_API_SECRET` | Client Secret |
| `SHOPIFY_SCOPES` | `read_products,write_products,read_orders,read_inventory,write_inventory` |
| `NEXT_PUBLIC_SHOPIFY_API_KEY` | Same as SHOPIFY_API_KEY |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI API key (for AI features) |

- [ ] Deploy

---

## 4. Test Installation (5 minutes)

- [ ] Install on development store
- [ ] Verify OAuth flow works
- [ ] Verify billing screen appears
- [ ] Verify dashboard loads
- [ ] Create a test bundle
- [ ] Test AI suggestions feature

---

## 5. App Store Submission Checklist

### Required Screenshots (1600x900 or 1200x900):
- [ ] Dashboard showing bundle list
- [ ] Create bundle modal with AI suggestions
- [ ] Bundle analytics/performance view
- [ ] AI "Frequently Bought Together" suggestions

### Listing Content:
- [ ] App name: Bundle Manager AI
- [ ] Tagline: "AI-powered product bundles that increase AOV"
- [ ] Category: Store management → Inventory management
- [ ] Detailed description (see template below)
- [ ] Key features list
- [ ] Support email
- [ ] Privacy policy page

### Policies:
- [ ] Privacy policy at `/privacy`
- [ ] Terms of service at `/terms`

---

## App Store Description Template

```
Bundle Manager AI uses artificial intelligence to analyze your store's order history and suggest the most profitable product bundles.

**How It Works:**
1. Connect your store - we analyze your order history
2. Get AI suggestions - see which products sell best together
3. Create bundles - one-click bundle creation with automatic pricing
4. Watch sales grow - bundles automatically increase your AOV

**Key Features:**

🤖 AI-Powered Suggestions
Our AI analyzes thousands of orders to find products that are frequently bought together. No more guessing which bundles will sell.

📦 Automatic Inventory Sync
When a bundle sells, inventory for each component product is automatically deducted. No overselling, no manual updates.

💰 Smart Pricing
Set bundle discounts (5-30% off) and let AI suggest optimal pricing based on your margins and competitor data.

📊 Bundle Analytics
Track which bundles perform best. See revenue, conversion rates, and AOV impact for each bundle.

🎯 One-Click Creation
Turn AI suggestions into live bundles with one click. Products, pricing, and inventory are all set up automatically.

**Pricing:**
- 7-day free trial
- $19.99/month after trial
- Cancel anytime

**Support:**
Email us at support@bundlemanager.ai for help or feature requests.
```

---

## Key Differentiators from Competitors

1. **AI suggestions** - We analyze order history to suggest bundles
2. **"Frequently bought together"** - Automatic detection
3. **One-click bundle creation** - From suggestion to live bundle instantly
4. **Bundle analytics** - Track performance, not just create bundles
5. **Smart pricing recommendations** - AI suggests optimal discounts

---

## Revenue Model

- $19.99/month
- 7-day free trial
- Target: 500 merchants = $10k/month MRR

---

## Competitor Analysis

| App | Price | AI? | Reviews |
|-----|-------|-----|---------|
| Bundler | $6.99-29.99 | No | 1500+ |
| Bundle Builder | $24.99 | No | 800+ |
| PickyStory | $9.50-49.50 | No | 700+ |
| **Bundle Manager AI** | $19.99 | YES | New |

Our edge: AI-powered suggestions. None of the top competitors have AI.
