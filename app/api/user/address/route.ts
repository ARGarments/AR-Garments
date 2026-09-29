import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export interface UserAddress {
  id?: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

// In-memory fallback address store (keyed by userId)
const memoryAddresses: Map<string, UserAddress> = new Map();

// GET /api/user/address?userId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // 1. Try querying Supabase
    try {
      const supabase = getServiceSupabase();
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const address: UserAddress = {
          id: data.id,
          userId: data.user_id,
          fullName: data.full_name,
          phone: data.phone,
          addressLine1: data.address_line1,
          addressLine2: data.address_line2 || '',
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          isDefault: data.is_default,
        };
        // sync memory
        memoryAddresses.set(userId, address);
        return NextResponse.json({ success: true, address });
      }
    } catch {
      // Supabase error or table not yet created — fall back to memory
    }

    // 2. Fallback to memory
    const cached = memoryAddresses.get(userId);
    if (cached) {
      return NextResponse.json({ success: true, address: cached });
    }

    return NextResponse.json({ success: true, address: null });
  } catch (err) {
    console.error('[GET /api/user/address] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/address — save or update user address
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      fullName,
      phone,
      addressLine1,
      addressLine2 = '',
      city,
      state,
      pincode,
    } = body;

    if (!userId || !fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'Missing required address fields' },
        { status: 400 }
      );
    }

    const addressData: UserAddress = {
      userId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : '',
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      isDefault: true,
    };

    // 1. Save or Update in Supabase
    let savedInDb = false;
    try {
      const supabase = getServiceSupabase();

      // Check if address already exists for this user
      const { data: existing } = await supabase
        .from('user_addresses')
        .select('id')
        .eq('user_id', addressData.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        // UPDATE existing record — DO NOT CREATE ANOTHER ENTRY
        const { data, error } = await supabase
          .from('user_addresses')
          .update({
            full_name: addressData.fullName,
            phone: addressData.phone,
            address_line1: addressData.addressLine1,
            address_line2: addressData.addressLine2,
            city: addressData.city,
            state: addressData.state,
            pincode: addressData.pincode,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (!error && data) {
          addressData.id = data.id;
          savedInDb = true;
        }
      } else {
        // INSERT first time
        const { data, error } = await supabase
          .from('user_addresses')
          .insert({
            user_id: addressData.userId,
            full_name: addressData.fullName,
            phone: addressData.phone,
            address_line1: addressData.addressLine1,
            address_line2: addressData.addressLine2,
            city: addressData.city,
            state: addressData.state,
            pincode: addressData.pincode,
            is_default: true,
          })
          .select()
          .single();

        if (!error && data) {
          addressData.id = data.id;
          savedInDb = true;
        }
      }
    } catch {
      // ignore, fall back to memory
    }

    // 2. Always persist to memory cache
    memoryAddresses.set(userId, addressData);

    return NextResponse.json(
      {
        success: true,
        message: savedInDb ? 'Address updated in database!' : 'Address updated!',
        address: addressData,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[POST /api/user/address] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/user/address?userId=...
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    try {
      const supabase = getServiceSupabase();
      await supabase.from('user_addresses').delete().eq('user_id', userId);
    } catch {
      // ignore
    }

    memoryAddresses.delete(userId);

    return NextResponse.json({ success: true, message: 'Address removed successfully' });
  } catch (err) {
    console.error('[DELETE /api/user/address] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
