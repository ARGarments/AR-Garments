import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminSession';
import { getPartyById, updateParty, calculatePartyMetrics, getPartyBatches } from '@/lib/partyService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/parties/[id] — Fetch single party details & Stock Meter metrics (Admin only)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const partyId = params.id;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const dateRange = from || to ? { from, to } : undefined;

    const party = await getPartyById(partyId);
    if (!party && partyId !== 'main_store') {
      return NextResponse.json({ success: false, error: 'Party not found.' }, { status: 404 });
    }

    const targetPartyId = partyId === 'main_store' ? null : partyId;
    const metrics = await calculatePartyMetrics(targetPartyId, dateRange);
    const batches = await getPartyBatches(targetPartyId);

    return NextResponse.json({
      success: true,
      party,
      metrics,
      batches,
    });
  } catch (error) {
    console.error(`Error in GET /api/admin/parties/${params.id}:`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch party details.' }, { status: 500 });
  }
}

// PATCH /api/admin/parties/[id] — Updates party details or toggles active status (Admin only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const partyId = params.id;
    const body = await request.json();

    const updated = await updateParty(partyId, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Party not found or update failed.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      party: updated,
      message: `Party "${updated.name}" updated successfully.`,
    });
  } catch (error) {
    console.error(`Error in PATCH /api/admin/parties/${params.id}:`, error);
    return NextResponse.json({ success: false, error: 'Failed to update party.' }, { status: 500 });
  }
}
