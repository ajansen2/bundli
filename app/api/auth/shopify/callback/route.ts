import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function topLevelRedirectHTML(url: string, message: string = 'Redirecting...'): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${message}</title>
<style>body{background:#0a0a0a;color:white;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.loader{text-align:center}.spinner{width:40px;height:40px;border:3px solid #333;border-top:3px solid #8b5cf6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px}@keyframes spin{to{transform:rotate(360deg)}}</style>
</head>
<body><div class="loader"><div class="spinner"></div><p>${message}</p></div>
<script>if(window.top&&window.top!==window.self){window.top.location.href=${JSON.stringify(url)}}else{window.location.href=${JSON.stringify(url)}}</script>
</body></html>`;
}

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
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-10/shop.json`, {
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
      // Reset subscription status if it was cancelled (reinstall case)
      const newStatus = existingStore.subscription_status === 'cancelled' ? 'trial' : existingStore.subscription_status;

      const { data, error: updateError } = await supabase
        .from('stores')
        .update({
          access_token: accessToken,
          store_name: shopInfo.name || shop,
          email: shopInfo.email,
          subscription_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStore.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Store update failed:', updateError);
        return NextResponse.json({
          error: 'Failed to update store',
          details: updateError.message
        }, { status: 500 });
      }

      store = data;
      console.log('✅ Store updated:', store.id);
    } else {
      const { data, error: insertError } = await supabase
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

      if (insertError) {
        console.error('❌ Store creation failed:', insertError);
        return NextResponse.json({
          error: 'Failed to create store',
          details: insertError.message
        }, { status: 500 });
      }

      store = data;
      console.log('✅ Store created:', store.id);
    }

    if (!store) {
      console.error('❌ Store is null after database operation');
      return NextResponse.json({
        error: 'Store operation returned null'
      }, { status: 500 });
    }

    // Register webhooks
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks`;
    const webhookTopics = ['app/uninstalled', 'customers/data_request', 'customers/redact', 'shop/redact', 'orders/create', 'app_subscriptions/update'];

    for (const topic of webhookTopics) {
      const address = topic === 'app/uninstalled' ? `${webhookUrl}/uninstall` :
                      topic === 'orders/create' ? `${webhookUrl}/orders` :
                      topic === 'app_subscriptions/update' ? `${webhookUrl}/subscription` :
                      `${webhookUrl}/compliance`;
      const result = await fetch(`https://${shop}/admin/api/2024-10/webhooks.json`, {
        method: 'POST',
        headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook: { topic, address, format: 'json' } }),
      });
      if (topic === 'app_subscriptions/update') {
        console.log('💰 Subscription webhook registration:', result.ok ? '✅' : '❌');
      }
    }

    // Create billing charge ($19.99/month)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
    const shopName = shop.replace('.myshopify.com', '');
    const isTestCharge = shop.includes('-test') || shop.includes('development') || shop.includes('dev-');
    const returnUrl = `${appUrl}/api/billing/callback?shop=${shop}&store_id=${store?.id}`;

    console.log('💰 Checking for existing charges...');

    // Check for existing pending or active charges
    const existingChargesResponse = await fetch(`https://${shop}/admin/api/2024-10/recurring_application_charges.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });

    let shouldCreateCharge = true;
    if (existingChargesResponse.ok) {
      const existingCharges = await existingChargesResponse.json();
      console.log('💰 Existing charges:', JSON.stringify(existingCharges.recurring_application_charges?.map((c: any) => ({ id: c.id, status: c.status, name: c.name }))));

      // If there's a pending charge, redirect to its confirmation URL
      const pendingCharge = existingCharges.recurring_application_charges?.find(
        (c: any) => c.status === 'pending'
      );
      if (pendingCharge) {
        console.log('💰 Found existing pending charge, redirecting to confirmation');
        return new NextResponse(
          topLevelRedirectHTML(pendingCharge.confirmation_url, 'Redirecting to billing approval...'),
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        );
      }

      // If there's an active charge, skip billing creation
      const activeCharge = existingCharges.recurring_application_charges?.find(
        (c: any) => c.status === 'active'
      );
      if (activeCharge) {
        console.log('✅ Already has active billing charge:', activeCharge.id);
        shouldCreateCharge = false;
      }
    } else {
      console.log('💰 Failed to fetch existing charges:', existingChargesResponse.status);
    }

    if (shouldCreateCharge) {
      console.log('💰 Creating new billing charge...');
      const chargeResponse = await fetch(`https://${shop}/admin/api/2024-10/recurring_application_charges.json`, {
        method: 'POST',
        headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recurring_application_charge: {
            name: 'Bundle Manager Pro',
            price: 19.99,
            trial_days: 7,
            return_url: returnUrl,
            ...(isTestCharge && { test: true }),
          }
        })
      });

      console.log('💰 Billing response status:', chargeResponse.status);

      if (chargeResponse.ok) {
        const { recurring_application_charge } = await chargeResponse.json();
        console.log('✅ Billing charge created, redirecting to confirmation');
        return new NextResponse(
          topLevelRedirectHTML(recurring_application_charge.confirmation_url, 'Redirecting to billing approval...'),
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        );
      } else {
        const errorText = await chargeResponse.text();
        console.error('❌ Billing charge failed:', chargeResponse.status, errorText);
      }
    }

    // Go to dashboard if already has active charge or billing creation fails
    console.log('📍 Redirecting to dashboard');
    const billingFailed = shouldCreateCharge; // If we wanted to create but didn't redirect, charge creation failed
    const shopifyAdminUrl = `https://admin.shopify.com/store/${shopName}/apps/${apiKey}?shop=${shop}${billingFailed ? '&billing_required=true' : ''}`;
    return new NextResponse(
      topLevelRedirectHTML(shopifyAdminUrl, 'Setting up your store...'),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'OAuth failed' }, { status: 500 });
  }
}
