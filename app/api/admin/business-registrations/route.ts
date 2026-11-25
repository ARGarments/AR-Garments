import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function deleteImageKitFileByUrl(fileUrl: string): Promise<boolean> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey || !fileUrl || !fileUrl.includes('imagekit.io')) return false;
  try {
    const fileName = fileUrl.split('/').pop()?.split('?')[0];
    if (!fileName) return false;
    const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');
    const searchRes = await fetch(
      `https://api.imagekit.io/v1/files?name=${encodeURIComponent(fileName)}&limit=1`,
      { headers: { Authorization: authHeader } }
    );
    if (!searchRes.ok) return false;
    const files = await searchRes.json();
    if (!Array.isArray(files) || files.length === 0 || !files[0]?.fileId) return false;
    const delRes = await fetch(`https://api.imagekit.io/v1/files/${files[0].fileId}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader },
    });
    return delRes.ok || delRes.status === 404;
  } catch {
    return false;
  }
}

// GET /api/admin/business-registrations — list all with optional ?status= filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status'); // 'pending' | 'approved' | 'rejected' | null

    const supabase = getServiceSupabase();

    // Auto-purge approved verification photos older than 48 hours
    try {
      const cutoffIso = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data: expiredDocs } = await supabase
        .from('business_registrations')
        .select('id, document_url')
        .eq('status', 'approved')
        .lte('reviewed_at', cutoffIso)
        .not('document_url', 'is', null)
        .like('document_url', 'http%');

      if (Array.isArray(expiredDocs) && expiredDocs.length > 0) {
        for (const row of expiredDocs) {
          if (row.document_url && row.document_url.startsWith('http')) {
            await deleteImageKitFileByUrl(row.document_url);
            await supabase
              .from('business_registrations')
              .update({ document_url: 'DELETED_AUTO_48H' })
              .eq('id', row.id);
          }
        }
      }
    } catch (cleanupErr) {
      console.warn('[GET /api/admin/business-registrations] Auto-cleanup warning:', cleanupErr);
    }

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
