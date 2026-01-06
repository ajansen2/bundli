import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch store preferences
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('bundle_stores')
      .select('notification_email, notify_bundle_sold, notify_low_inventory, notify_weekly_summary')
      .eq('shop_domain', shop)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({
      preferences: {
        notificationEmail: data.notification_email || '',
        notifyBundleSold: data.notify_bundle_sold ?? true,
        notifyLowInventory: data.notify_low_inventory ?? true,
        notifyWeeklySummary: data.notify_weekly_summary ?? true,
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update store preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, notificationEmail, notifyBundleSold, notifyLowInventory, notifyWeeklySummary } = body;

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (notificationEmail !== undefined) updateData.notification_email = notificationEmail;
    if (notifyBundleSold !== undefined) updateData.notify_bundle_sold = notifyBundleSold;
    if (notifyLowInventory !== undefined) updateData.notify_low_inventory = notifyLowInventory;
    if (notifyWeeklySummary !== undefined) updateData.notify_weekly_summary = notifyWeeklySummary;

    const { error } = await supabase
      .from('bundle_stores')
      .update(updateData)
      .eq('shop_domain', shop);

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
