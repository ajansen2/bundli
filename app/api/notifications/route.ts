import { NextRequest, NextResponse } from 'next/server';
import {
  sendBundleSoldEmail,
  sendLowInventoryEmail,
  sendWeeklySummaryEmail,
  BundleSoldEmailData,
  LowInventoryEmailData,
  WeeklySummaryEmailData
} from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    let result;

    switch (type) {
      case 'bundle_sold':
        result = await sendBundleSoldEmail(data as BundleSoldEmailData);
        break;
      case 'low_inventory':
        result = await sendLowInventoryEmail(data as LowInventoryEmailData);
        break;
      case 'weekly_summary':
        result = await sendWeeklySummaryEmail(data as WeeklySummaryEmailData);
        break;
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({ success: true, id: result.id });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
