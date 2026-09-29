import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  createdAt: string;
}

// In-memory fallback
const memorySubscribers: NewsletterSubscriber[] = [];

// Helper: validate email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// GET /api/newsletter — list all subscribers (admin)
export async function GET() {
  try {
    try {
      const supabase = getServiceSupabase();
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const formatted: NewsletterSubscriber[] = data.map((row) => ({
          id: String(row.id),
          email: String(row.email),
          status: (row.status as 'active' | 'unsubscribed') || 'active',
          createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
        }));
        return NextResponse.json({ success: true, subscribers: formatted });
      }
    } catch {
      // fallback to memory
    }

    const sorted = [...memorySubscribers].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json({ success: true, subscribers: sorted });
  } catch (err: unknown) {
    console.error('[GET /api/newsletter] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}

// POST /api/newsletter — subscribe email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = typeof body?.email === 'string' ? body.email.trim() : '';

    if (!rawEmail || !isValidEmail(rawEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase();
    const newId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    let savedInDb = false;

    // 1. Try Supabase
    try {
      const supabase = getServiceSupabase();

      // Check if already subscribed
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id, email, status')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          success: true,
          message: 'You are already subscribed to our newsletter!',
          alreadySubscribed: true,
        });
      }

      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          id: newId,
          email,
          status: 'active',
          created_at: nowIso,
        })
        .select()
        .single();

      if (!error && data) {
        savedInDb = true;
      }
    } catch {
      // fallback to memory
    }

    // 2. Also keep memory store synchronized
    const existingMemory = memorySubscribers.find(
      (s) => s.email.toLowerCase() === email
    );

    if (existingMemory) {
      return NextResponse.json({
        success: true,
        message: 'You are already subscribed to our newsletter!',
        alreadySubscribed: true,
      });
    }

    const newSubscriber: NewsletterSubscriber = {
      id: newId,
      email,
      status: 'active',
      createdAt: nowIso,
    };
    memorySubscribers.unshift(newSubscriber);

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for joining our fashion family! 🎉',
        subscriber: newSubscriber,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[POST /api/newsletter] Error:', err);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

// DELETE /api/newsletter?id=... — remove subscriber (admin)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id && !email) {
      return NextResponse.json(
        { error: 'Subscriber ID or email required' },
        { status: 400 }
      );
    }

    try {
      const supabase = getServiceSupabase();
      let query = supabase.from('newsletter_subscribers').delete();
      if (id) {
        query = query.eq('id', id);
      } else if (email) {
        query = query.eq('email', email.toLowerCase());
      }
      await query;
    } catch {
      // ignore
    }

    // Update memory
    const idx = memorySubscribers.findIndex(
      (s) => (id && s.id === id) || (email && s.email.toLowerCase() === email.toLowerCase())
    );
    if (idx !== -1) {
      memorySubscribers.splice(idx, 1);
    }

    return NextResponse.json({ success: true, message: 'Subscriber removed successfully' });
  } catch (err: unknown) {
    console.error('[DELETE /api/newsletter] Error:', err);
    return NextResponse.json({ error: 'Failed to remove subscriber' }, { status: 500 });
  }
}
