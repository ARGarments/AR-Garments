import crypto from 'crypto';

const RAZORPAY_API_URL = 'https://api.razorpay.com/v1';

interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
}

interface CreateRazorpayOrderInput {
  amount: number;
  receipt: string;
  notes: Record<string, string>;
}

export class RazorpayConfigurationError extends Error {}

export class RazorpayApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getRazorpayCredentials(): RazorpayCredentials {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new RazorpayConfigurationError(
      'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured on the server.'
    );
  }

  return { keyId, keySecret };
}

function secureCompareHex(expected: string, received: string): boolean {
  if (!/^[a-f0-9]+$/i.test(expected) || !/^[a-f0-9]+$/i.test(received)) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(received, 'hex');
  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

async function razorpayRequest<T>(path: string, init: RequestInit): Promise<T> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`${RAZORPAY_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${authorization}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new RazorpayApiError(
      `Razorpay request failed with status ${response.status}: ${responseBody}`,
      response.status
    );
  }

  return (await response.json()) as T;
}

export function getRazorpayKeyId(): string {
  return getRazorpayCredentials().keyId;
}

export async function createRazorpayOrder(
  input: CreateRazorpayOrderInput
): Promise<RazorpayOrder> {
  return razorpayRequest<RazorpayOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: input.amount,
      currency: 'INR',
      receipt: input.receipt,
      notes: input.notes,
    }),
  });
}

export async function getRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await razorpayRequest<RazorpayPayment>(
        `/payments/${encodeURIComponent(paymentId)}`,
        { method: 'GET' }
      );
    } catch (error) {
      lastError = error;
      const shouldRetry =
        !(error instanceof RazorpayApiError) || error.status === 429 || error.status >= 500;
      if (!shouldRetry || attempt === 2) throw error;

      console.warn('Retrying Razorpay payment lookup', {
        paymentId,
        attempt,
        error: error instanceof Error ? error.message : error,
      });
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw lastError;
}

export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const { keySecret } = getRazorpayCredentials();
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return secureCompareHex(expectedSignature, signature);
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    throw new RazorpayConfigurationError(
      'RAZORPAY_WEBHOOK_SECRET must be configured on the server.'
    );
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return secureCompareHex(expectedSignature, signature);
}
