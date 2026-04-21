import { NextRequest, NextResponse } from 'next/server';
import {
  sendBundleSoldEmail,
  sendLowInventoryEmail,
  sendWeeklySummaryEmail,
} from '@/lib/email';
import { getAuthenticatedShop } from '@/lib/verify-session';

// Test endpoint to verify email notifications are working
export async function POST(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, email, storeName } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'bundle_sold':
        result = await sendBundleSoldEmail({
          storeName: storeName || 'Test Store',
          storeEmail: email,
          bundleName: 'Summer Essentials Bundle',
          bundlePrice: 89.99,
          itemsSold: [
            { title: 'Classic White T-Shirt', quantity: 2 },
            { title: 'Slim Fit Jeans', quantity: 1 },
            { title: 'Leather Belt', quantity: 1 },
          ],
          orderNumber: '1001',
          customerName: 'John Doe',
        });
        break;

      case 'low_inventory':
        result = await sendLowInventoryEmail({
          storeName: storeName || 'Test Store',
          storeEmail: email,
          productTitle: 'Classic White T-Shirt',
          currentStock: 5,
          bundlesAffected: ['Summer Essentials Bundle', 'Office Starter Pack', 'Casual Outfit Set'],
        });
        break;

      case 'weekly_summary':
        result = await sendWeeklySummaryEmail({
          storeName: storeName || 'Test Store',
          storeEmail: email,
          totalBundlesSold: 47,
          totalRevenue: 4235.53,
          topBundle: { name: 'Summer Essentials Bundle', sold: 23 },
          periodStart: 'Dec 29, 2024',
          periodEnd: 'Jan 5, 2025',
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid type. Use: bundle_sold, low_inventory, or weekly_summary' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: `Test ${type} email sent to ${email}` });
    } else {
      return NextResponse.json({ error: 'Failed to send test email', details: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
