import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const shop = request.nextUrl.searchParams.get('shop');
    const chargeId = request.nextUrl.searchParams.get('charge_id');

    console.log('💰 Billing callback:', { shop, chargeId });

    const shopName = shop?.replace('.myshopify.com', '') || '';
    const redirectUrl = `https://admin.shopify.com/store/${shopName}/apps/${process.env.SHOPIFY_API_KEY}`;

    if (!shop || !chargeId) {
      return NextResponse.redirect(`${redirectUrl}?billing=error`);
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: store } = await supabase
      .from('stores')
      .select('access_token')
      .eq('shop_domain', shop)
      .single();

    if (!store) {
      console.error('❌ Store not found:', shop);
      return NextResponse.redirect(`${redirectUrl}?billing=error`);
    }

    const chargeResponse = await fetch(
      `https://${shop}/admin/api/2024-10/recurring_application_charges/${chargeId}.json`,
      { headers: { 'X-Shopify-Access-Token': store.access_token } }
    );

    if (!chargeResponse.ok) {
      console.error('❌ Failed to fetch charge');
      return NextResponse.redirect(`${redirectUrl}?billing=error`);
    }

    const { recurring_application_charge: charge } = await chargeResponse.json();
    console.log('📋 Charge status:', charge.status);

    if (charge.status === 'accepted') {
      const activateResponse = await fetch(
        `https://${shop}/admin/api/2024-10/recurring_application_charges/${chargeId}/activate.json`,
        {
          method: 'POST',
          headers: { 'X-Shopify-Access-Token': store.access_token, 'Content-Type': 'application/json' },
        }
      );

      if (activateResponse.ok) {
        await supabase
          .from('stores')
          .update({
            subscription_status: 'active',
            billing_charge_id: chargeId,
            updated_at: new Date().toISOString()
          })
          .eq('shop_domain', shop);

        console.log('✅ Subscription activated for:', shop);
        return NextResponse.redirect(`${redirectUrl}?billing=success`);
      }
    } else if (charge.status === 'active') {
      await supabase
        .from('stores')
        .update({
          subscription_status: 'active',
          billing_charge_id: chargeId,
          updated_at: new Date().toISOString()
        })
        .eq('shop_domain', shop);

      console.log('✅ Subscription already active for:', shop);
      return NextResponse.redirect(`${redirectUrl}?billing=success`);
    } else if (charge.status === 'declined') {
      await supabase
        .from('stores')
        .update({ subscription_status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('shop_domain', shop);

      console.log('❌ Subscription declined for:', shop);
      return NextResponse.redirect(`${redirectUrl}?billing=declined`);
    }

    return NextResponse.redirect(`${redirectUrl}?billing=pending`);
  } catch (error) {
    console.error('Billing callback error:', error);
    const shop = request.nextUrl.searchParams.get('shop');
    const shopName = shop?.replace('.myshopify.com', '') || '';
    return NextResponse.redirect(`https://admin.shopify.com/store/${shopName}/apps/${process.env.SHOPIFY_API_KEY}?billing=error`);
  }
}
