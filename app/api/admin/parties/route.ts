import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminSession';
import { getParties, createParty } from '@/lib/partyService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/parties — Returns list of all parties (Admin only)
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const parties = await getParties(!activeOnly);

    return NextResponse.json({
      success: true,
      parties,
      total: parties.length,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/parties:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch parties.' }, { status: 500 });
  }
}

// POST /api/admin/parties — Creates a new party (Admin only)
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Party Name is required.' }, { status: 400 });
    }

    const created = await createParty(body);
    return NextResponse.json({
      success: true,
      party: created,
      message: `Party "${created.name}" created successfully.`,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/parties:', error);
    return NextResponse.json({ success: false, error: 'Failed to create party.' }, { status: 500 });
  }
}
