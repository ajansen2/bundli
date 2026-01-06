import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all bundles for a store
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
  }

  try {
    // Get store ID
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('shop_domain', shop)
      .single();

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get bundles with their items
    const { data: bundles, error } = await supabase
      .from('bundles')
      .select(`
        *,
        bundle_items (*)
      `)
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bundles:', error);
      return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 });
    }

    // Transform for frontend
    const transformedBundles = bundles.map(bundle => ({
      id: bundle.id,
      name: bundle.name,
      description: bundle.description || '',
      items: bundle.bundle_items.map((item: {
        id: string;
        shopify_product_id: string;
        shopify_variant_id: string;
        product_title: string;
        product_image_url: string;
        quantity: number;
        price_at_creation: number;
      }) => ({
        productId: item.shopify_product_id,
        variantId: item.shopify_variant_id || item.shopify_product_id,
        title: item.product_title,
        image: item.product_image_url,
        quantity: item.quantity,
        price: parseFloat(item.price_at_creation?.toString() || '0'),
      })),
      originalPrice: parseFloat(bundle.original_price?.toString() || '0'),
      bundlePrice: parseFloat(bundle.bundle_price?.toString() || '0'),
      discountPercent: bundle.discount_percent || 0,
      isActive: bundle.is_active,
      timesPurchased: bundle.times_purchased || 0,
      revenue: parseFloat(bundle.total_revenue?.toString() || '0'),
      createdAt: bundle.created_at,
    }));

    return NextResponse.json({ bundles: transformedBundles });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new bundle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, name, description, items, originalPrice, bundlePrice, discountPercent } = body;

    if (!shop || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get store ID
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('shop_domain', shop)
      .single();

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Create bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('bundles')
      .insert({
        store_id: store.id,
        name: name || `Bundle of ${items.length} items`,
        description,
        original_price: originalPrice,
        bundle_price: bundlePrice,
        discount_percent: discountPercent,
        is_active: true,
      })
      .select()
      .single();

    if (bundleError) {
      console.error('Error creating bundle:', bundleError);
      return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 });
    }

    // Create bundle items
    const bundleItems = items.map((item: {
      productId: string;
      variantId: string;
      title: string;
      image: string;
      quantity: number;
      price: number;
    }) => ({
      bundle_id: bundle.id,
      shopify_product_id: item.productId,
      shopify_variant_id: item.variantId,
      product_title: item.title,
      product_image_url: item.image,
      quantity: item.quantity,
      price_at_creation: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('bundle_items')
      .insert(bundleItems);

    if (itemsError) {
      console.error('Error creating bundle items:', itemsError);
      // Rollback bundle creation
      await supabase.from('bundles').delete().eq('id', bundle.id);
      return NextResponse.json({ error: 'Failed to create bundle items' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bundle: {
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        items,
        originalPrice,
        bundlePrice,
        discountPercent,
        isActive: true,
        timesPurchased: 0,
        revenue: 0,
        createdAt: bundle.created_at,
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a bundle
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bundleId, isActive, name, description, discountPercent } = body;

    if (!bundleId) {
      return NextResponse.json({ error: 'Bundle ID required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (isActive !== undefined) updateData.is_active = isActive;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (discountPercent !== undefined) updateData.discount_percent = discountPercent;

    const { error } = await supabase
      .from('bundles')
      .update(updateData)
      .eq('id', bundleId);

    if (error) {
      console.error('Error updating bundle:', error);
      return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a bundle
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bundleId = searchParams.get('bundleId');

  if (!bundleId) {
    return NextResponse.json({ error: 'Bundle ID required' }, { status: 400 });
  }

  try {
    // Bundle items will be cascade deleted
    const { error } = await supabase
      .from('bundles')
      .delete()
      .eq('id', bundleId);

    if (error) {
      console.error('Error deleting bundle:', error);
      return NextResponse.json({ error: 'Failed to delete bundle' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
