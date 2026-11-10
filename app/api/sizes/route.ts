import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const DEFAULT_SIZES = [
  'Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL',
  'Set of All Sizes (S, M, L, XL, XXL)', 'Unstitched'
];

// In-memory fallback if table doesn't exist yet
let memorySizes: { id: string; name: string; sort_order: number }[] = DEFAULT_SIZES.map((name, idx) => ({
  id: `size-${idx + 1}`,
  name,
  sort_order: idx
}));

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('product_sizes')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return NextResponse.json(data);
    }

    return NextResponse.json(memorySizes);
  } catch {
    return NextResponse.json(memorySizes);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Size name is required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    try {
      const { data, error } = await supabase
        .from('product_sizes')
        .insert([{ name, sort_order: Number(body.sort_order) || 99 }])
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json(data);
      }
    } catch {
      // Table may not exist yet, fallback to memory
    }

    const newObj = {
      id: `size-${Date.now()}`,
      name,
      sort_order: memorySizes.length
    };
    memorySizes.push(newObj);
    return NextResponse.json(newObj);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const oldName = String(body.oldName || '').trim();
    const newName = String(body.newName || '').trim();
    const id = body.id ? String(body.id) : null;

    if (!newName) {
      return NextResponse.json({ error: 'New size name is required' }, { status: 400 });
    }
    if (!id && !oldName) {
      return NextResponse.json({ error: 'Size id or oldName is required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    try {
      let query = supabase.from('product_sizes').update({ name: newName });
      if (id) query = query.eq('id', id);
      else if (oldName) query = query.eq('name', oldName);
      const { data, error } = await query.select().single();
      if (!error && data) {
        // Also update memory
        memorySizes = memorySizes.map((s) => (s.name === oldName || s.id === id ? { ...s, name: newName } : s));
        return NextResponse.json(data);
      }
    } catch {
      // ignore
    }

    // Fallback in memory
    memorySizes = memorySizes.map((s) => (s.name === oldName || s.id === id ? { ...s, name: newName } : s));
    return NextResponse.json({ success: true, name: newName });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const name = searchParams.get('name');

    if (!id && !name) {
      return NextResponse.json({ error: 'Size id or name required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    try {
      let query = supabase.from('product_sizes').delete();
      if (id) query = query.eq('id', id);
      else if (name) query = query.eq('name', name);
      await query;
    } catch {
      // Ignore
    }

    memorySizes = memorySizes.filter((s) => (id ? s.id !== id : s.name !== name));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
