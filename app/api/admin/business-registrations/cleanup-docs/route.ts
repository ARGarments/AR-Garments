import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Helper to delete a file from ImageKit given its full URL.
 */
async function deleteFromImageKit(fileUrl: string): Promise<boolean> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey || !fileUrl || !fileUrl.includes('imagekit.io')) return false;

  try {
    const fileName = fileUrl.split('/').pop()?.split('?')[0];
    if (!fileName) return false;

    const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');

    // 1. Search for fileId in ImageKit by filename
    const searchRes = await fetch(
      `https://api.imagekit.io/v1/files?name=${encodeURIComponent(fileName)}&limit=1`,
      {
        headers: { Authorization: authHeader },
      }
    );

    if (!searchRes.ok) return false;
    const files = await searchRes.json();
    if (!Array.isArray(files) || files.length === 0 || !files[0]?.fileId) {
      return false;
    }

    const fileId = files[0].fileId;

    // 2. Delete the file
    const delRes = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader },
    });

    return delRes.ok || delRes.status === 404;
  } catch (err) {
    console.error('[deleteFromImageKit] Error:', err);
    return false;
  }
}

/**
 * POST /api/admin/business-registrations/cleanup-docs
 * 
 * Supports two modes:
 * 1. Single delete: { id: "biz-123" } -> Deletes the document photo for that registration immediately.
 * 2. Automated batch purge: { hoursOlderThan: 48 } (or default 48h) -> Purges all approved registration photos older than X hours.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, hoursOlderThan = 48 } = body;
    const supabase = getServiceSupabase();

    // ── Mode 1: Delete photo for a single specific registration ──
    if (id) {
      const { data: reg, error: fetchErr } = await supabase
        .from('business_registrations')
        .select('id, document_url')
        .eq('id', id)
        .single();

      if (fetchErr || !reg) {
        return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
      }

      if (reg.document_url && reg.document_url.startsWith('http')) {
        await deleteFromImageKit(reg.document_url);
      }

      await supabase
        .from('business_registrations')
        .update({ document_url: 'DELETED_MANUALLY' })
        .eq('id', id);

      return NextResponse.json({
        success: true,
        message: 'Verification photo deleted permanently to free up storage.',
      });
    }

    // ── Mode 2: Batch auto-purge for approved registrations older than X hours ──
    const cutoffDate = new Date(Date.now() - hoursOlderThan * 60 * 60 * 1000).toISOString();

    const { data: eligibleList, error: queryErr } = await supabase
      .from('business_registrations')
      .select('id, document_url, reviewed_at')
      .eq('status', 'approved')
      .lte('reviewed_at', cutoffDate)
      .not('document_url', 'is', null)
      .like('document_url', 'http%');

    if (queryErr) {
      return NextResponse.json({ error: 'Failed to query records.' }, { status: 500 });
    }

    let purgedCount = 0;
    for (const item of eligibleList || []) {
      if (item.document_url && item.document_url.startsWith('http')) {
        await deleteFromImageKit(item.document_url);
        await supabase
          .from('business_registrations')
          .update({ document_url: 'DELETED_AUTO_48H' })
          .eq('id', item.id);
        purgedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      purgedCount,
      message: `Cleaned up ${purgedCount} verification photo(s) older than ${hoursOlderThan} hours.`,
    });
  } catch (err) {
    console.error('[POST /api/admin/business-registrations/cleanup-docs] Error:', err);
    return NextResponse.json({ error: 'Server error during cleanup.' }, { status: 500 });
  }
}

/**
 * GET endpoint for automated cron trigger (e.g. Vercel Cron, Supabase webhook, or custom scheduler)
 */
export async function GET() {
  const req = new NextRequest('http://localhost/api/admin/business-registrations/cleanup-docs', {
    method: 'POST',
    body: JSON.stringify({ hoursOlderThan: 48 }),
  });
  return POST(req);
}
