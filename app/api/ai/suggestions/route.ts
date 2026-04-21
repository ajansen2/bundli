import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

/**
 * AI Bundle Suggestions API
 * Analyzes order history to find frequently bought together products
 */

export async function GET(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get existing AI suggestions for this store
    const { data: suggestions, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'pending')
      .order('confidence_score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching suggestions:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions || [],
    });
  } catch (error) {
    console.error('AI suggestions error:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}

/**
 * Generate new AI suggestions by analyzing order history
 */
export async function POST(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('🤖 [AI] Analyzing order history for store:', storeId);

    // Get order items for this store
    const { data: orderItems, error: orderError } = await supabase
      .from('order_items')
      .select('*')
      .eq('store_id', storeId);

    if (orderError) {
      throw orderError;
    }

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No order history to analyze yet',
        suggestions: [],
      });
    }

    // Group items by order
    const orderGroups: Record<string, typeof orderItems> = {};
    for (const item of orderItems) {
      if (!orderGroups[item.shopify_order_id]) {
        orderGroups[item.shopify_order_id] = [];
      }
      orderGroups[item.shopify_order_id].push(item);
    }

    // Find product pairs that appear together
    const pairCounts: Record<string, {
      count: number;
      products: { id: string; title: string }[];
      totalRevenue: number;
    }> = {};

    for (const orderId in orderGroups) {
      const items = orderGroups[orderId];
      if (items.length < 2) continue;

      // Generate all pairs
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const ids = [items[i].shopify_product_id, items[j].shopify_product_id].sort();
          const key = ids.join('|');

          if (!pairCounts[key]) {
            pairCounts[key] = {
              count: 0,
              products: [
                { id: items[i].shopify_product_id, title: items[i].product_title },
                { id: items[j].shopify_product_id, title: items[j].product_title },
              ],
              totalRevenue: 0,
            };
          }

          pairCounts[key].count++;
          pairCounts[key].totalRevenue +=
            (parseFloat(items[i].price) || 0) + (parseFloat(items[j].price) || 0);
        }
      }
    }

    // Filter pairs with at least 3 occurrences and sort by count
    const topPairs = Object.entries(pairCounts)
      .filter(([_, data]) => data.count >= 3)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    console.log(`🤖 [AI] Found ${topPairs.length} potential bundle pairs`);

    // Create suggestions
    const newSuggestions = [];
    for (const [_, data] of topPairs) {
      const productIds = data.products.map(p => p.id);
      const productTitles = data.products.map(p => p.title);

      // Check if suggestion already exists
      const { data: existing } = await supabase
        .from('ai_suggestions')
        .select('id')
        .eq('store_id', storeId)
        .contains('product_ids', productIds)
        .maybeSingle();

      if (!existing) {
        const confidenceScore = Math.min(data.count / 20, 1); // Max confidence at 20+ occurrences
        const suggestedDiscount = confidenceScore > 0.7 ? 15 : confidenceScore > 0.4 ? 10 : 5;

        const { data: newSuggestion, error: insertError } = await supabase
          .from('ai_suggestions')
          .insert({
            store_id: storeId,
            product_ids: productIds,
            product_titles: productTitles,
            confidence_score: confidenceScore,
            times_bought_together: data.count,
            suggested_discount: suggestedDiscount,
            suggested_price: data.totalRevenue / data.count * (1 - suggestedDiscount / 100),
            status: 'pending',
          })
          .select()
          .single();

        if (!insertError && newSuggestion) {
          newSuggestions.push(newSuggestion);
        }
      }
    }

    console.log(`🤖 [AI] Created ${newSuggestions.length} new suggestions`);

    // Get all pending suggestions
    const { data: allSuggestions } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'pending')
      .order('confidence_score', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      message: `Analyzed ${Object.keys(orderGroups).length} orders, created ${newSuggestions.length} new suggestions`,
      suggestions: allSuggestions || [],
    });
  } catch (error) {
    console.error('AI suggestions generation error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
