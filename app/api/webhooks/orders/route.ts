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

    const order = JSON.parse(body);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Get store
    const { data: store } = await supabase
      .from('stores')
      .select('id, access_token')
      .eq('shop_domain', shopDomain)
      .single();

    if (!store) {
      console.log('Store not found for order webhook');
      return NextResponse.json({ success: true });
    }

    // Check each line item for bundles
    for (const lineItem of order.line_items || []) {
      const productId = lineItem.product_id;

      // Check if this product is a bundle
      const { data: bundle } = await supabase
        .from('bundles')
        .select('*, bundle_items(*)')
        .eq('store_id', store.id)
        .eq('shopify_product_id', productId.toString())
        .single();

      if (bundle && bundle.bundle_items) {
        console.log(`Bundle sold: ${bundle.name}, deducting inventory for ${bundle.bundle_items.length} items`);

        // Deduct inventory for each bundle component
        for (const item of bundle.bundle_items) {
          const quantityToDeduct = item.quantity * lineItem.quantity;

          // Use Shopify API to adjust inventory
          // This would call Shopify's inventory adjustment API
          console.log(`Would deduct ${quantityToDeduct} of product ${item.shopify_product_id}`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
