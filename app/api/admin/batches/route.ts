import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminSession';
import { getPartyBatches, createPartyBatch } from '@/lib/partyService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/batches — List batches (optional ?productId=... or ?partyId=...)
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get('partyId');
    const productId = searchParams.get('productId');

    let batches = await getPartyBatches(partyId === 'null' ? null : partyId || undefined);
    if (productId) {
      batches = batches.filter((b) => b.productId === productId);
    }

    return NextResponse.json({ success: true, batches });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch batches.' }, { status: 500 });
  }
}

// POST /api/admin/batches — Manually inward a new batch to a Party
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.inwardQuantity || Number(body.inwardQuantity) <= 0) {
      return NextResponse.json({ success: false, error: 'Valid inward quantity is required.' }, { status: 400 });
    }

    const created = await createPartyBatch(body);
    return NextResponse.json({ success: true, batch: created });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ success: false, error: 'Failed to create batch.' }, { status: 500 });
  }
}
