import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const shop = request.nextUrl.searchParams.get('shop');
    const host = request.nextUrl.searchParams.get('host');

    if (!shop || !shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    // Check if store already has a valid token - skip OAuth if so
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: store } = await supabase
      .from('stores')
      .select('access_token, subscription_status')
      .eq('shop_domain', shop)
      .maybeSingle();

    // If store exists with valid token and not cancelled, go straight to dashboard
    if (store?.access_token && store.subscription_status !== 'cancelled') {
      // Verify token is still valid with a quick API call
      const testResponse = await fetch(`https://${shop}/admin/api/2024-10/shop.json`, {
        headers: { 'X-Shopify-Access-Token': store.access_token },
      });

      if (testResponse.ok) {
        // Token is valid, redirect to dashboard
        const shopName = shop.replace('.myshopify.com', '');
        const apiKey = process.env.SHOPIFY_API_KEY;
        const dashboardUrl = `https://admin.shopify.com/store/${shopName}/apps/${apiKey}`;
        return NextResponse.redirect(dashboardUrl);
      }
    }

    // Token invalid or doesn't exist - proceed with OAuth
    const state = crypto.randomBytes(32).toString('hex');
    const apiKey = process.env.SHOPIFY_API_KEY;
    const scopes = process.env.SHOPIFY_SCOPES || 'read_products,write_products,read_inventory,write_inventory';
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/shopify/callback`;

    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;

    const response = NextResponse.redirect(authUrl);
    response.cookies.set('shopify_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5
    });
    response.cookies.set('shopify_oauth_shop', shop, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5
    });

    return response;
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json({ error: 'OAuth initialization failed' }, { status: 500 });
  }
}
