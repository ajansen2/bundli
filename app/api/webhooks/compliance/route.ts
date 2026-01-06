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
    const topic = request.headers.get('x-shopify-topic') || '';

    if (!verifyShopifyWebhook(body, hmacHeader)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    switch (topic) {
      case 'customers/data_request':
      case 'customers/redact':
        console.log(`${topic} acknowledged - Bundle Manager doesn't store customer PII`);
        break;

      case 'shop/redact':
        const { data: store } = await supabase
          .from('stores')
          .select('id')
          .eq('shop_domain', data.shop_domain)
          .single();

        if (store) {
          await supabase.from('bundles').delete().eq('store_id', store.id);
          await supabase.from('stores').delete().eq('id', store.id);
        }
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Compliance webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
