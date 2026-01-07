import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const shop = request.nextUrl.searchParams.get('shop');
    const chargeId = request.nextUrl.searchParams.get('charge_id');

    if (!shop || !chargeId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: store } = await supabase
      .from('stores')
      .select('access_token')
      .eq('shop_domain', shop)
      .single();

    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const chargeResponse = await fetch(
      `https://${shop}/admin/api/2024-10/recurring_application_charges/${chargeId}.json`,
      { headers: { 'X-Shopify-Access-Token': store.access_token } }
    );

    if (!chargeResponse.ok) throw new Error('Failed to verify charge');

    const { recurring_application_charge: charge } = await chargeResponse.json();

    if (charge.status === 'accepted') {
      await fetch(
        `https://${shop}/admin/api/2024-10/recurring_application_charges/${chargeId}/activate.json`,
        {
          method: 'POST',
          headers: { 'X-Shopify-Access-Token': store.access_token, 'Content-Type': 'application/json' },
        }
      );

      await supabase
        .from('stores')
        .update({ subscription_status: 'active', updated_at: new Date().toISOString() })
        .eq('shop_domain', shop);
    }

    return NextResponse.json({ success: true, status: charge.status });
  } catch (error) {
    console.error('Billing callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
