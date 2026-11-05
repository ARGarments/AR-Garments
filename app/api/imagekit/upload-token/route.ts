import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/imagekit/upload-token
 * Returns a short-lived ImageKit upload authentication token for client-side uploads.
 * The private key NEVER leaves the server.
 */
export async function GET() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey  = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY;

  if (!privateKey || !publicKey) {
    return NextResponse.json({ error: 'ImageKit not configured.' }, { status: 500 });
  }

  // Token valid for 30 minutes
  const expire    = Math.floor(Date.now() / 1000) + 30 * 60;
  const token     = crypto.randomUUID();
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  return NextResponse.json({ token, expire, signature, publicKey });
}
