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
    subject: 'Your AR Garment login code',
    instruction: 'Use this one-time code to sign in to your AR Garment account:',
    tag: 'email-login',
  });
}

export function sendRegistrationCode(input: SendLoginCodeInput): Promise<string> {
  return sendCodeEmail(input, {
    subject: 'Your AR Garment registration code',
    instruction: 'Use this one-time code to verify your email and create your AR Garment account:',
    tag: 'email-registration',
  });
}

export function sendPasswordResetCode(input: SendLoginCodeInput): Promise<string> {
  return sendCodeEmail(input, {
    subject: 'Your AR Garment password reset code',
    instruction: 'Use this one-time code to reset your AR Garment account password:',
    tag: 'email-password-reset',
  });
}

export function sendEmailChangeCode(input: SendLoginCodeInput): Promise<string> {
  return sendCodeEmail(input, {
    subject: 'Your AR Garment email verification code',
    instruction: 'Use this one-time code to verify and link your new email address to your AR Garment account:',
    tag: 'email-change',
  });
}

export interface SendCustomerReplyInput {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  replyMessage: string;
  originalMessage?: string;
}

export async function sendCustomerSupportReply(input: SendCustomerReplyInput): Promise<string> {
  const configuration = getBrevoConfiguration();
  const recipientName = escapeHtml(input.recipientName || 'Customer');
  const senderEmail = 'support@argarment.com';
  const senderName = 'AR Garment Support';
  const safeReply = escapeHtml(input.replyMessage).replace(/\n/g, '<br/>');
  const safeOriginal = input.originalMessage
    ? escapeHtml(input.originalMessage).replace(/\n/g, '<br/>')
    : '';

  const htmlContent = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#faf8f3;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#083028;">
    <div style="max-width:600px;margin:24px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
      <!-- Header -->
      <div style="background:#083028;color:#ffffff;padding:24px 28px;border-bottom:3px solid #D7A83B;">
        <table style="width:100%;">
          <tr>
            <td>
              <h1 style="margin:0;font-size:20px;font-weight:800;letter-spacing:1px;color:#F6CE6C;">AR GARMENT</h1>
              <p style="margin:4px 0 0;font-size:11px;color:#d1fae5;letter-spacing:0.5px;">Official Wholesale Customer Support</p>
            </td>
            <td style="text-align:right;">
              <span style="font-size:11px;background:rgba(255,255,255,0.15);padding:4px 10px;border-radius:20px;color:#ffffff;">Official Reply</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Body -->
      <div style="padding:28px;">
        <p style="margin:0 0 16px;font-size:15px;font-weight:600;">Dear ${recipientName},</p>
        <div style="font-size:14px;line-height:1.7;color:#1f2937;margin-bottom:24px;">
          ${safeReply}
        </div>

        ${safeOriginal ? `
        <div style="margin-top:24px;padding:16px;background:#f9fafb;border-left:4px solid #D7A83B;border-radius:8px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Your Original Inquiry:</p>
          <p style="margin:0;font-size:13px;line-height:1.5;color:#4b5563;font-style:italic;">"${safeOriginal}"</p>
        </div>` : ''}

        <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.6;">
          <p style="margin:0 0 4px;font-weight:700;color:#083028;">Need further assistance?</p>
          <p style="margin:0;">Reply directly to this email or write to <a href="mailto:support@argarment.com" style="color:#083028;font-weight:700;">support@argarment.com</a>.</p>
          <p style="margin:4px 0 0;">Phone &amp; WhatsApp: +91 98765 43210 | Prayagraj, UP - 211003, India</p>
        </div>
      </div>
    </div>
  </body>
</html>`;

  const response = await fetch(BREVO_EMAIL_API_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': configuration.apiKey,
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: senderName,
      },
      replyTo: {
        email: senderEmail,
        name: senderName,
      },
      to: [
        {
          email: input.recipientEmail,
          name: input.recipientName,
        },
      ],
      subject: input.subject.startsWith('Re:') ? input.subject : `Re: ${input.subject} - AR Garment Support`,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new BrevoApiError(
      `Brevo customer reply failed with status ${response.status}: ${responseBody}`,
      response.status
    );
  }

  const data = (await response.json()) as BrevoSendResponse;
  return data.messageId || 'sent';
}


