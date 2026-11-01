import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminSession';
import { calculateMasterOverview, processReturnWindowProgression } from '@/lib/partyService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/parties/metrics — Returns combined Master Store Overview & Party Stock Meters (Admin only)
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const dateRange = from || to ? { from, to } : undefined;

    // Advance any 7-day return windows that have completed
    await processReturnWindowProgression();

    const masterOverview = await calculateMasterOverview(dateRange);

    return NextResponse.json({
      success: true,
      data: masterOverview,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/parties/metrics:', error);
    return NextResponse.json({ success: false, error: 'Failed to compute master inventory metrics.' }, { status: 500 });
  }
}
