import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getRedirectUrl(shop: string | null): string {
  const apiKey = process.env.SHOPIFY_API_KEY;
  if (!apiKey) {
    console.error('SHOPIFY_API_KEY is not set');
  }
  const shopName = shop?.replace('.myshopify.com', '') || '';
  return `https://admin.shopify.com/store/${shopName}/apps/${apiKey}`;
}

export async function GET(request: NextRequest) {
  try {
    const shop = request.nextUrl.searchParams.get('shop');
    const chargeId = request.nextUrl.searchParams.get('charge_id');

    console.log('Billing callback:', { shop, chargeId });

    const redirectUrl = getRedirectUrl(shop);

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
      console.error('Store not found:', shop);
      return NextResponse.redirect(`${redirectUrl}?billing=error`);
    }

    // Use GraphQL activeSubscriptions query instead of deprecated REST API
    const subscriptionResponse = await fetch(
      `https://${shop}/admin/api/2024-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': store.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query {
              currentAppInstallation {
                activeSubscriptions {
                  id
                  name
                  status
                }
              }
            }
          `,
        }),
      }
    );

    if (!subscriptionResponse.ok) {
      console.error('Failed to query subscriptions via GraphQL');
      return NextResponse.redirect(`${redirectUrl}?billing=error`);
    }

    const gqlData = await subscriptionResponse.json();
    const activeSubscriptions = gqlData.data?.currentAppInstallation?.activeSubscriptions || [];
    console.log('Active subscriptions:', activeSubscriptions.length);

    const activeSub = activeSubscriptions.find((s: { status: string }) => s.status === 'ACTIVE');

    if (activeSub) {
      await supabase
        .from('stores')
        .update({
          subscription_status: 'active',
          billing_charge_id: activeSub.id,
          updated_at: new Date().toISOString()
        })
        .eq('shop_domain', shop);

      console.log('Subscription active for:', shop);
      return NextResponse.redirect(`${redirectUrl}?billing=success`);
    }

    // No active subscription found - check if it was declined
    // (user came back from confirmation page without approving)
    console.log('No active subscription found after callback for:', shop);
    await supabase
      .from('stores')
      .update({ subscription_status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('shop_domain', shop);

    return NextResponse.redirect(`${redirectUrl}?billing=declined`);
  } catch (error) {
    console.error('Billing callback error:', error);
    const shop = request.nextUrl.searchParams.get('shop');
    return NextResponse.redirect(`${getRedirectUrl(shop)}?billing=error`);
  }
}
