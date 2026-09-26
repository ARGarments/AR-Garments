import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET /api/products — fetch all products (optionally filtered)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isNewArrival = searchParams.get('is_new_arrival');
  const isBestSeller = searchParams.get('is_best_seller');

  const supabase = getAdminClient();
  let query = supabase.from('products').select('*').order('sort_order');

  if (isNewArrival === 'true') query = query.eq('is_new_arrival', true);
  if (isBestSeller === 'true') query = query.eq('is_best_seller', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// POST /api/products — create a new product
export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getAdminClient();

  const numericPrice = parseInt(body.price?.replace(/[^\d]/g, '') || '0', 10);

  const { data, error } = await supabase
    .from('products')
    .insert({
      id: body.id || `prod-${Date.now()}`,
      name: body.name,
      price: body.price,
      numeric_price: numericPrice,
      category: body.category,
      image: body.image,
      stock: body.stock ?? 10,
      active: body.active ?? true,
      is_new_arrival: body.isNewArrival ?? false,
      is_best_seller: body.isBestSeller ?? false,
      sort_order: body.order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/products — update a product by id in query string
export async function PATCH(request: Request) {
  const body = await request.json();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = getAdminClient();
  const numericPrice = body.price
    ? parseInt(body.price.replace(/[^\d]/g, '') || '0', 10)
    : undefined;

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.price !== undefined) patch.price = body.price;
  if (numericPrice !== undefined) patch.numeric_price = numericPrice;
  if (body.category !== undefined) patch.category = body.category;
  if (body.image !== undefined) patch.image = body.image;
  if (body.stock !== undefined) patch.stock = body.stock;
  if (body.active !== undefined) patch.active = body.active;
  if (body.isNewArrival !== undefined) patch.is_new_arrival = body.isNewArrival;
  if (body.isBestSeller !== undefined) patch.is_best_seller = body.isBestSeller;
  if (body.order !== undefined) patch.sort_order = body.order;

  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/products — delete a product by id in query string
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
