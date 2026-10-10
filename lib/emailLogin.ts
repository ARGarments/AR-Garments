import crypto from 'crypto';

export const EMAIL_LOGIN_CODE_TTL_MINUTES = 10;
export const EMAIL_LOGIN_RESEND_SECONDS = 60;
export const EMAIL_LOGIN_MAX_ATTEMPTS = 5;

export class EmailLoginConfigurationError extends Error {}
export class InvalidEmailError extends Error {}

export function normalizeEmail(value: unknown): string {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InvalidEmailError('Please enter a valid email address.');
  }
  return email;
}

export function generateEmailLoginCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashEmailLoginCode(email: string, code: string): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new EmailLoginConfigurationError(
      'AUTH_SECRET must be configured before email login can be used.'
    );
  }

  return crypto.createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');
}

export function verifyEmailLoginCode(
  email: string,
  code: string,
  storedHash: string
): boolean {
  const receivedHash = hashEmailLoginCode(email, code);
  const receivedBuffer = Buffer.from(receivedHash, 'hex');
  const storedBuffer = Buffer.from(storedHash, 'hex');

  return (
    receivedBuffer.length === storedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, storedBuffer)
  );
}
