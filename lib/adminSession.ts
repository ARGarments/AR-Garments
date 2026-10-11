import crypto from 'crypto';
import { NextRequest } from 'next/server';

const AUTH_SECRET = process.env.AUTH_SECRET || 'ar-garments-super-secret-hmac-key-2026';

interface AdminSessionPayload {
  role: string;
  iat: number;
  exp: number;
}

export function createAdminToken(): string {
  const payload: AdminSessionPayload = {
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyAdminToken(token: string): boolean {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(data)
      .digest('base64url');
    const suppliedSignature = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    if (
      suppliedSignature.length !== expectedSignatureBuffer.length ||
      !crypto.timingSafeEqual(suppliedSignature, expectedSignatureBuffer)
    ) {
      return false;
    }

    const payload = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf-8')
    ) as AdminSessionPayload;
    return payload.role === 'admin' && payload.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function isAdminRequest(request: NextRequest): boolean {
  const token = request.cookies.get('ar_admin_session')?.value;
  return Boolean(token && verifyAdminToken(token));
}
