import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
  }

  try {
    // Get store access token from database
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('access_token')
      .eq('shop_domain', shop)
      .single();

    if (storeError || !store?.access_token) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Fetch products from Shopify
    const response = await fetch(
      `https://${shop}/admin/api/2024-10/products.json?limit=50`,
      {
        headers: {
          'X-Shopify-Access-Token': store.access_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Shopify API error:', response.status, await response.text());
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    const data = await response.json();

    // Transform products for the frontend
    const products = data.products.map((product: {
      id: number;
      title: string;
      images: { src: string }[];
      variants: {
        id: number;
        title: string;
        price: string;
        inventory_quantity: number;
      }[];
    }) => ({
      id: product.id.toString(),
      title: product.title,
      image: product.images[0]?.src || null,
      price: product.variants[0]?.price || '0.00',
      inventory: product.variants.reduce((sum: number, v: { inventory_quantity: number }) => sum + (v.inventory_quantity || 0), 0),
      variants: product.variants.map((v: {
        id: number;
        title: string;
        price: string;
        inventory_quantity: number;
      }) => ({
        id: v.id.toString(),
        title: v.title,
        price: v.price,
        inventory: v.inventory_quantity || 0,
      })),
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
