import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

export async function GET(request: NextRequest) {
  try {
    const shop = getAuthenticatedShop(request);
    if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: storeData, error } = await supabase
      .from('stores')
      .select('*')
      .eq('shop_domain', shop)
      .maybeSingle();

    if (error || !storeData) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    let subscriptionTier = 'trial';
    if (storeData.subscription_status === 'active') subscriptionTier = 'pro';
    else if (storeData.subscription_status === 'cancelled') subscriptionTier = 'free';

    return NextResponse.json({
      store: {
        id: storeData.id,
        store_name: storeData.store_name || shop.replace('.myshopify.com', ''),
        shop_domain: shop,
        email: storeData.email || '',
        subscription_status: storeData.subscription_status || 'trial',
        subscription_tier: subscriptionTier,
        trial_ends_at: storeData.trial_ends_at || null,
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
