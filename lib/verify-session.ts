import { NextRequest } from 'next/server';
import crypto from 'crypto';

function verifyAndDecodeSessionToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_PRODUCTION;
    if (!secret) return null;
    const signatureInput = `${parts[0]}.${parts[1]}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(signatureInput).digest('base64url');
    if (expectedSignature !== parts[2]) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    const dest: string | undefined = payload.dest;
    if (!dest) return null;
    try { return new URL(dest).hostname; } catch { return dest; }
  } catch { return null; }
}

export function getAuthenticatedShop(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const shop = verifyAndDecodeSessionToken(authHeader.slice(7));
    if (shop) return shop;
  }
  return null;
}
