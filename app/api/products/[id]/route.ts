import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, numeric_price, category, image, images, stock, active, is_new_arrival, is_best_seller, sort_order, description, specification, shipping_care, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
