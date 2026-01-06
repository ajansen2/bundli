import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';

function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  if (!SHOPIFY_API_SECRET || !hmacHeader) return false;
  const generatedHash = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(body, 'utf8').digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(generatedHash), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256') || '';
    const shopDomain = request.headers.get('x-shopify-shop-domain') || '';

    if (!verifyShopifyWebhook(body, hmacHeader)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const domain = shopDomain || data.domain || data.myshopify_domain;

    await supabase
      .from('stores')
      .update({ subscription_status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('shop_domain', domain);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Uninstall webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
