import { NextRequest, NextResponse } from 'next/server';
import { sendCustomerSupportReply } from '@/lib/brevo';
import { getServiceSupabase } from '@/lib/supabase';
import { memoryContactMessages } from '@/lib/contactMessages';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messageId = typeof body?.messageId === 'string' ? body.messageId.trim() : '';
    const customerEmail = typeof body?.customerEmail === 'string' ? body.customerEmail.trim() : '';
    const customerName = typeof body?.customerName === 'string' ? body.customerName.trim() : 'Customer';
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : 'Inquiry Response';
    const replyMessage = typeof body?.replyMessage === 'string' ? body.replyMessage.trim() : '';
    const originalMessage = typeof body?.originalMessage === 'string' ? body.originalMessage.trim() : '';

    if (!customerEmail || !replyMessage) {
      return NextResponse.json(
        { error: 'Customer email and reply message are required.' },
        { status: 400 }
      );
    }

    // 1. Send via Brevo with official sender support@argarment.com
    await sendCustomerSupportReply({
      recipientEmail: customerEmail,
      recipientName: customerName,
      subject,
      replyMessage,
      originalMessage,
    });

    const nowIso = new Date().toISOString();
    const replyNote = `[Replied via support@argarment.com on ${new Date().toLocaleDateString('en-IN')}]: ${replyMessage.slice(0, 150)}${replyMessage.length > 150 ? '...' : ''}`;

    // 2. Update status to 'replied' in Supabase
    if (messageId) {
      try {
        const supabase = getServiceSupabase();
        // Fetch existing notes first to append
        const { data: existing } = await supabase
          .from('contact_messages')
          .select('admin_notes')
          .eq('id', messageId)
          .maybeSingle();

        const combinedNotes = existing?.admin_notes
          ? `${existing.admin_notes}\n\n${replyNote}`
          : replyNote;

        await supabase
          .from('contact_messages')
          .update({
            status: 'replied',
            admin_notes: combinedNotes,
          })
          .eq('id', messageId);
      } catch (dbErr) {
        console.warn('Could not update contact status in Supabase:', dbErr);
      }

      // 3. Update status in memory store
      const memIdx = memoryContactMessages.findIndex((m) => m.id === messageId);
      if (memIdx !== -1) {
        const existingNotes = memoryContactMessages[memIdx].adminNotes || '';
        memoryContactMessages[memIdx].status = 'replied';
        memoryContactMessages[memIdx].adminNotes = existingNotes
          ? `${existingNotes}\n\n${replyNote}`
          : replyNote;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Official reply sent successfully from support@argarment.com!',
      sender: 'support@argarment.com',
    });
  } catch (error) {
    console.error('[POST /api/contact/reply] Error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to send reply email';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
