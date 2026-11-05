import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/admin/business-registrations — list all with optional ?status= filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status'); // 'pending' | 'approved' | 'rejected' | null

    const supabase = getServiceSupabase();
    let query = supabase
      .from('business_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/admin/business-registrations] DB error:', error);
      return NextResponse.json({ error: 'Failed to fetch registrations.' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[GET /api/admin/business-registrations] Error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// PATCH /api/admin/business-registrations — approve, reject, or reopen a registration
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, admin_note } = body;

    if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const updateData: Record<string, any> = {
      status,
      admin_note: admin_note !== undefined ? admin_note : '',
    };

    if (status === 'pending') {
      // Reopening an application resets the review state so admin can decide again
      updateData.reviewed_at = null;
    } else {
      updateData.reviewed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('business_registrations')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('[PATCH /api/admin/business-registrations] DB error:', error);
      return NextResponse.json({ error: 'Failed to update registration.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error('[PATCH /api/admin/business-registrations] Error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
