import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || 'your_imagekit_private_key';
  
  // Unique token and timestamp (expire in 30 minutes)
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 1800; // current timestamp in seconds + 30 min

  // HMAC-SHA1 signature of token + expire using private key
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  return NextResponse.json({
    token,
    expire,
    signature,
  });
}
