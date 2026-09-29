import { NextRequest, NextResponse } from 'next/server';

const AUTH_SECRET = process.env.AUTH_SECRET || 'ar-garments-super-secret-hmac-key-2026';

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlToString(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return atob(base64);
}

// Edge-safe token verification using Web Crypto API
async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    if (!token || typeof token !== 'string' || !token.includes('.')) return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [data, signature] = parts;
    if (!data || !signature) return false;

    // Check payload expiry and role first
    const payloadStr = base64UrlToString(data);
    const payload = JSON.parse(payloadStr);
    if (!payload || payload.role !== 'admin') return false;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false;

    // Verify HMAC signature
    const keyData = new TextEncoder().encode(AUTH_SECRET);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = base64UrlDecode(signature);
    const dataBytes = new TextEncoder().encode(data);
    return await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      sigBytes.buffer as ArrayBuffer,
      dataBytes.buffer as ArrayBuffer
    );
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page without authentication
  if (pathname === '/admin/login') {
    // If admin is ALREADY logged in and visits /admin/login, redirect to /admin
    const token = req.cookies.get('ar_admin_session')?.value;
    if (token && (await verifyAdminToken(token))) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  }

  // Protect all other /admin routes
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('ar_admin_session')?.value;

    if (!token || !(await verifyAdminToken(token))) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
