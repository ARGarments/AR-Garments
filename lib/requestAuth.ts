import { NextRequest } from 'next/server';
import { AuthUser, verifySessionToken } from '@/lib/auth';

export function getAuthenticatedUser(request: NextRequest): AuthUser | null {
  const cookieToken = request.cookies.get('ar_session')?.value;
  const authorization = request.headers.get('authorization');
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined;

  return verifySessionToken(cookieToken || bearerToken || '');
}
