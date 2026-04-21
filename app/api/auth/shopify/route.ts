// This route is deprecated. Installation must be initiated from the Shopify App Store.
// The active install entry point is /api/auth/shopify/install
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Please install via the Shopify App Store.' },
    { status: 410 }
  );
}
