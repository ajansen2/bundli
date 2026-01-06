import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');
    const hmac = searchParams.get('hmac');

    if (!code || !shop) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const storedState = request.cookies.get('shopify_oauth_state')?.value;
    const storedShop = request.cookies.get('shopify_oauth_shop')?.value;

    if (storedState && state && state !== storedState) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    if (storedShop && storedShop !== shop) {
      return NextResponse.json({ error: 'Shop mismatch' }, { status: 400 });
    }

    // Verify HMAC
    const query = new URLSearchParams(searchParams.toString());
    query.delete('hmac');
    const message = Array.from(query.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('&');

    const apiSecret = process.env.SHOPIFY_API_SECRET!;
    const generatedHmac = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');

    if (generatedHmac !== hmac) {
      return NextResponse.json({ error: 'HMAC validation failed' }, { status: 403 });
    }

    // Exchange code for access token
    const apiKey = process.env.SHOPIFY_API_KEY;
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: apiKey, client_secret: apiSecret, code }),
    });

    if (!tokenResponse.ok) throw new Error('Failed to exchange code');

    const { access_token: accessToken } = await tokenResponse.json();

    // Get shop details
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const { shop: shopInfo } = await shopResponse.json();

    // Save to database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingStore } = await supabase
      .from('stores')
      .select('*')
      .eq('shop_domain', shop)
      .maybeSingle();

    let store;
    if (existingStore) {
      const { data } = await supabase
        .from('stores')
        .update({
          access_token: accessToken,
          store_name: shopInfo.name || shop,
          email: shopInfo.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStore.id)
        .select()
        .single();
      store = data;
    } else {
      const { data } = await supabase
        .from('stores')
        .insert({
          shop_domain: shop,
          shopify_store_id: shopInfo.id?.toString(),
          store_name: shopInfo.name || shop,
          email: shopInfo.email,
          access_token: accessToken,
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();
      store = data;
    }

    // Register webhooks
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks`;
    const webhookTopics = ['app/uninstalled', 'customers/data_request', 'customers/redact', 'shop/redact', 'orders/create'];

    for (const topic of webhookTopics) {
      const address = topic === 'app/uninstalled' ? `${webhookUrl}/uninstall` :
                      topic === 'orders/create' ? `${webhookUrl}/orders` :
                      `${webhookUrl}/compliance`;
      await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook: { topic, address, format: 'json' } }),
      });
    }

    // Create billing charge ($19.99/month)
    const shopName = shop.replace('.myshopify.com', '');
    const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/bundlemanager/dashboard?billing=success&shop=${shop}&store_id=${store?.id}`;

    const chargeResponse = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges.json`, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recurring_application_charge: {
          name: 'Bundle Manager Pro',
          price: 19.99,
          trial_days: 7,
          return_url: returnUrl,
          test: shop.includes('-test'),
        }
      })
    });

    if (chargeResponse.ok) {
      const { recurring_application_charge } = await chargeResponse.json();
      const response = NextResponse.redirect(recurring_application_charge.confirmation_url);
      response.cookies.delete('shopify_oauth_state');
      response.cookies.delete('shopify_oauth_shop');
      return response;
    }

    const shopifyAdminUrl = `https://admin.shopify.com/store/${shopName}/apps/${apiKey}`;
    const response = NextResponse.redirect(shopifyAdminUrl);
    response.cookies.delete('shopify_oauth_state');
    response.cookies.delete('shopify_oauth_shop');
    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'OAuth failed' }, { status: 500 });
  }
}
