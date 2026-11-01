import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminSession';
import { processReturnWindowProgression } from '@/lib/partyService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST /api/admin/parties/cron-return-window — Triggers 7-day return window progression to Final Sold
export async function POST(request: NextRequest) {
  // Authorization check (can be triggered by Admin or external cron with secret)
  const cronSecret = request.headers.get('x-cron-secret');
  const validSecret = process.env.CRON_SECRET || 'ar-return-window-cron-secret-2026';
  const isAuthorized = isAdminRequest(request) || cronSecret === validSecret;

  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const result = await processReturnWindowProgression();
    return NextResponse.json({
      success: true,
      message: `Processed 7-day return window. ${result.finalizedCount} order items auto-finalized to Final Sold.`,
      finalizedCount: result.finalizedCount,
    });
  } catch (error) {
    console.error('Error in cron-return-window:', error);
    return NextResponse.json({ success: false, error: 'Failed to process return windows.' }, { status: 500 });
  }
}
