const BREVO_EMAIL_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface BrevoConfiguration {
  apiKey: string;
  senderEmail: string;
  senderName: string;
}

interface SendLoginCodeInput {
  recipientEmail: string;
  recipientName: string;
  code: string;
  expiresInMinutes: number;
}

interface CodeEmailContent {
  subject: string;
  instruction: string;
  tag: string;
}

interface BrevoSendResponse {
  messageId: string;
}

export class BrevoConfigurationError extends Error {}

export class BrevoApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getBrevoConfiguration(): BrevoConfiguration {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim();

  if (!apiKey || !senderEmail || !senderName) {
    throw new BrevoConfigurationError(
      'BREVO_API_KEY, BREVO_SENDER_EMAIL, and BREVO_SENDER_NAME must be configured.'
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
    throw new BrevoConfigurationError('BREVO_SENDER_EMAIL must be a valid email address.');
  }

  return { apiKey, senderEmail, senderName };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function sendCodeEmail(
  input: SendLoginCodeInput,
  content: CodeEmailContent
): Promise<string> {
  const configuration = getBrevoConfiguration();
  const recipientName = escapeHtml(input.recipientName || 'Customer');
  const senderName = escapeHtml(configuration.senderName);
  let response: Response;
  try {
    response = await fetch(BREVO_EMAIL_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': configuration.apiKey,
      },
      body: JSON.stringify({
        sender: {
          email: configuration.senderEmail,
          name: configuration.senderName,
        },
        to: [
          {
            email: input.recipientEmail,
            name: input.recipientName,
          },
        ],
        subject: content.subject,
        htmlContent: `<!doctype html>
<html>
  <body style="margin:0;background:#faf8f3;font-family:Arial,sans-serif;color:#083028;">
    <div style="max-width:560px;margin:32px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="background:#083028;color:#ffffff;padding:22px 28px;font-size:20px;font-weight:700;">${senderName}</div>
      <div style="padding:28px;">
        <p style="margin:0 0 16px;">Hello ${recipientName},</p>
        <p style="margin:0 0 20px;line-height:1.6;">${content.instruction}</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;background:#faf8f3;border-radius:12px;padding:18px;color:#083028;">${input.code}</div>
        <p style="margin:20px 0 0;font-size:13px;color:#4b5563;line-height:1.6;">This code expires in ${input.expiresInMinutes} minutes. If you did not request it, you can safely ignore this email.</p>
      </div>
    </div>
  </body>
</html>`,
        tags: [content.tag],
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    throw new BrevoApiError(
      `Brevo email request could not be completed: ${
        error instanceof Error ? error.message : 'Unknown network error'
      }`,
      503
    );
  }

  if (!response.ok) {
    const responseBody = await response.text();
    throw new BrevoApiError(
      `Brevo email request failed with status ${response.status}: ${responseBody}`,
      response.status
    );
  }

  const data = (await response.json()) as BrevoSendResponse;
  if (!data.messageId) {
    throw new BrevoApiError('Brevo did not return a message ID.', response.status);
  }

  return data.messageId;
}

export function sendLoginCode(input: SendLoginCodeInput): Promise<string> {
  return sendCodeEmail(input, {
    subject: 'Your AR Garments login code',
    instruction: 'Use this one-time code to sign in to your AR Garments account:',
    tag: 'email-login',
  });
}

export function sendRegistrationCode(input: SendLoginCodeInput): Promise<string> {
  return sendCodeEmail(input, {
    subject: 'Your AR Garments registration code',
    instruction: 'Use this one-time code to verify your email and create your AR Garments account:',
    tag: 'email-registration',
  });
}
