import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { ContactMessage, ContactStatus, memoryContactMessages } from '@/lib/contactMessages';

export const dynamic = 'force-dynamic';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// GET /api/contact — Fetch customer queries (admin)
// Query params: ?status=unread | read | replied | archived, ?search=keyword
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const searchQuery = searchParams.get('search')?.toLowerCase().trim();

    let messages: ContactMessage[] = [];

    // 1. Try querying Supabase
    try {
      const supabase = getServiceSupabase();
      let query = supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (!error && Array.isArray(data) && data.length > 0) {
        messages = data.map((row) => ({
          id: String(row.id),
          name: String(row.name || ''),
          email: String(row.email || ''),
          phone: row.phone ? String(row.phone) : '',
          subject: String(row.subject || 'General Inquiry'),
          message: String(row.message || ''),
          status: (row.status as ContactStatus) || 'unread',
          adminNotes: row.admin_notes ? String(row.admin_notes) : '',
          createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
        }));
      }
    } catch {
      // Supabase query error, fallback to memory
    }

    // 2. If Supabase returned empty or table does not exist, use memory
    if (messages.length === 0) {
      let list = [...memoryContactMessages];
      if (statusFilter && statusFilter !== 'all') {
        list = list.filter((m) => m.status === statusFilter);
      }
      messages = list;
    }

    // Apply search filter if present
    if (searchQuery) {
      messages = messages.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery) ||
          m.email.toLowerCase().includes(searchQuery) ||
          (m.phone && m.phone.toLowerCase().includes(searchQuery)) ||
          m.subject.toLowerCase().includes(searchQuery) ||
          m.message.toLowerCase().includes(searchQuery)
      );
    }

    // Calculate quick counts
    const totalCount = memoryContactMessages.length;
    const unreadCount = memoryContactMessages.filter((m) => m.status === 'unread').length;
    const repliedCount = memoryContactMessages.filter((m) => m.status === 'replied').length;

    return NextResponse.json({
      success: true,
      messages,
      counts: {
        total: totalCount,
        unread: unreadCount,
        replied: repliedCount,
      },
    });
  } catch (err: unknown) {
    console.error('[GET /api/contact] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch customer queries' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/contact — User submits contact form
// Body: { name, email, phone?, subject?, message }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const subject = typeof body?.subject === 'string' && body.subject.trim() ? body.subject.trim() : 'General Inquiry';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Please enter your name' }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: 'Please enter your message' }, { status: 400 });
    }

    const newId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newMessage: ContactMessage = {
      id: newId,
      name,
      email,
      phone,
      subject,
      message,
      status: 'unread',
      adminNotes: '',
      createdAt: nowIso,
    };

    // 1. Try Supabase insert
    try {
      const supabase = getServiceSupabase();
      await supabase.from('contact_messages').insert({
        id: newId,
        name,
        email,
        phone,
        subject,
        message,
        status: 'unread',
        admin_notes: '',
        created_at: nowIso,
      });
    } catch {
      // In-memory fallback will preserve it
    }

    // 2. Always prepend to in-memory store
    memoryContactMessages.unshift(newMessage);

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been received. Our team will contact you shortly.',
      id: newId,
      data: newMessage,
    });
  } catch (err: unknown) {
    console.error('[POST /api/contact] Error:', err);
    return NextResponse.json(
      { error: 'Failed to submit contact message. Please try again.' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/contact — Admin updates status or admin notes
// Body: { id, status?, adminNotes? }
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = typeof body?.id === 'string' ? body.id.trim() : '';

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const updates: Partial<ContactMessage> = {};
    if (body.status && ['unread', 'read', 'replied', 'archived'].includes(body.status)) {
      updates.status = body.status as ContactStatus;
    }
    if (typeof body.adminNotes === 'string') {
      updates.adminNotes = body.adminNotes;
    }

    // 1. Update in Supabase
    try {
      const supabase = getServiceSupabase();
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.adminNotes !== undefined) dbUpdates.admin_notes = updates.adminNotes;

      await supabase.from('contact_messages').update(dbUpdates).eq('id', id);
    } catch {
      // ignore
    }

    // 2. Update in memory
    const idx = memoryContactMessages.findIndex((m) => m.id === id);
    if (idx !== -1) {
      memoryContactMessages[idx] = {
        ...memoryContactMessages[idx],
        ...updates,
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Query updated successfully',
      data: idx !== -1 ? memoryContactMessages[idx] : { id, ...updates },
    });
  } catch (err: unknown) {
    console.error('[PATCH /api/contact] Error:', err);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/contact — Admin deletes query
// Query params: ?id=xxx
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // 1. Delete from Supabase
    try {
      const supabase = getServiceSupabase();
      await supabase.from('contact_messages').delete().eq('id', id);
    } catch {
      // ignore
    }

    // 2. Delete from memory
    const idx = memoryContactMessages.findIndex((m) => m.id === id);
    if (idx !== -1) {
      memoryContactMessages.splice(idx, 1);
    }

    return NextResponse.json({
      success: true,
      message: 'Query deleted successfully',
    });
  } catch (err: unknown) {
    console.error('[DELETE /api/contact] Error:', err);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
