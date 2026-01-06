import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'Bundle Manager',
    timestamp: new Date().toISOString(),
  });
}
