import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Create Billing Charge using GraphQL API
 * REST API is deprecated - use appSubscriptionCreate mutation
 */
export async function POST(request: NextRequest) {
  console.log('💰 [BILLING CREATE] Starting...');

  try {
    const { storeId, shop } = await request.json();
    console.log('💰 [BILLING CREATE] Params:', { storeId, shop });

    if (!storeId || !shop) {
      console.log('❌ [BILLING CREATE] Missing params');
      return NextResponse.json({ error: 'Missing storeId or shop' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get store with access token
    console.log('💰 [BILLING CREATE] Looking up store...');
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      console.log('❌ [BILLING CREATE] Store not found:', storeError);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    console.log('✅ [BILLING CREATE] Found store:', store.shop_domain);

    const accessToken = store.access_token;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bundlemanager.app';

    // Check if we have a valid access token
    if (!accessToken || accessToken === '' || accessToken === 'revoked') {
      console.log('❌ [BILLING CREATE] No valid access token for store');
      return NextResponse.json({
        error: 'No valid access token - OAuth required',
        needsOAuth: true
      }, { status: 401 });
    }

    const isTestStore = shop.includes('-test') || shop.includes('development') || shop.includes('dev-');
    console.log('💰 [BILLING CREATE] Test store:', isTestStore, 'App URL:', appUrl);

    // Check for existing subscriptions using GraphQL
    console.log('💰 [BILLING CREATE] Checking existing subscriptions via GraphQL...');
    const existingResponse = await fetch(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
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

    if (existingResponse.ok) {
      const existingData = await existingResponse.json();
      const activeSubscriptions = existingData.data?.currentAppInstallation?.activeSubscriptions || [];
      console.log('💰 [BILLING CREATE] Found subscriptions:', activeSubscriptions.length);

      // Already has active subscription
      const active = activeSubscriptions.find((s: any) => s.status === 'ACTIVE');
      if (active) {
        console.log('✅ [BILLING CREATE] Found active subscription');
        await supabase
          .from('stores')
          .update({ subscription_status: 'active', billing_charge_id: active.id })
          .eq('id', storeId);
        return NextResponse.json({ status: 'active', message: 'Already subscribed' });
      }
    }

    // Create new subscription using GraphQL (REST API is deprecated)
    const returnUrl = `${appUrl}/api/billing/callback?shop=${shop}&store_id=${storeId}`;
    console.log('💰 [BILLING CREATE] Creating subscription via GraphQL...');

    const chargeResponse = await fetch(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation AppSubscriptionCreate($name: String!, $returnUrl: URL!, $trialDays: Int, $test: Boolean, $lineItems: [AppSubscriptionLineItemInput!]!) {
              appSubscriptionCreate(
                name: $name
                returnUrl: $returnUrl
                trialDays: $trialDays
                test: $test
                lineItems: $lineItems
              ) {
                appSubscription {
                  id
                  status
                }
                confirmationUrl
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          variables: {
            name: 'Bundle Manager Pro',
            returnUrl: returnUrl,
            trialDays: 7,
            test: isTestStore,
            lineItems: [
              {
                plan: {
                  appRecurringPricingDetails: {
                    price: { amount: 19.99, currencyCode: 'USD' },
                    interval: 'EVERY_30_DAYS',
                  },
                },
              },
            ],
          },
        }),
      }
    );

    const chargeData = await chargeResponse.json();
    console.log('💰 [BILLING CREATE] GraphQL response:', JSON.stringify(chargeData, null, 2));

    // Check for GraphQL errors
    if (chargeData.errors) {
      console.error('❌ [BILLING CREATE] GraphQL errors:', chargeData.errors);
      return NextResponse.json({
        error: 'GraphQL error',
        details: chargeData.errors
      }, { status: 500 });
    }

    // Check for user errors
    const userErrors = chargeData.data?.appSubscriptionCreate?.userErrors;
    if (userErrors && userErrors.length > 0) {
      console.error('❌ [BILLING CREATE] User errors:', userErrors);

      // Check if this is a Managed Pricing App
      const isManagedPricing = userErrors.some((e: any) =>
        e.message?.includes('Managed Pricing')
      );

      if (isManagedPricing) {
        console.log('💰 [BILLING CREATE] Managed Pricing App - redirecting to admin');
        const shopName = shop.replace('.myshopify.com', '');
        return NextResponse.json({
          status: 'managed_pricing',
          message: 'This app uses Shopify managed pricing.',
          adminUrl: `https://admin.shopify.com/store/${shopName}/charges/app_subscriptions`
        });
      }

      return NextResponse.json({
        error: userErrors[0].message,
        details: userErrors
      }, { status: 400 });
    }

    const confirmationUrl = chargeData.data?.appSubscriptionCreate?.confirmationUrl;
    if (!confirmationUrl) {
      console.error('❌ [BILLING CREATE] No confirmation URL returned');
      return NextResponse.json({
        error: 'No confirmation URL returned',
        details: chargeData
      }, { status: 500 });
    }

    console.log('✅ [BILLING CREATE] Subscription created, confirmation URL received');

    return NextResponse.json({
      status: 'created',
      confirmationUrl
    });

  } catch (error) {
    console.error('❌ [BILLING CREATE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
