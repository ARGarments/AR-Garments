import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET /api/hero-slides — fetch all slides ordered by sort_order
export async function GET() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/hero-slides — create a new slide
export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('hero_slides')
    .insert({
      id: body.id || `slide-${Date.now()}`,
      title: body.title,
      subtitle: body.subtitle,
      button_text: body.buttonText ?? 'Shop Now',
      button_link: body.buttonLink ?? '/category',
      image: body.image,
      label: body.label ?? 'Timeless Ethnic Wear',
      active: body.active ?? true,
      sort_order: body.order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/hero-slides?id=... — update a slide
export async function PATCH(request: Request) {
  const body = await request.json();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = getAdminClient();
  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.subtitle !== undefined) patch.subtitle = body.subtitle;
  if (body.buttonText !== undefined) patch.button_text = body.buttonText;
  if (body.buttonLink !== undefined) patch.button_link = body.buttonLink;
  if (body.image !== undefined) patch.image = body.image;
  if (body.label !== undefined) patch.label = body.label;
  if (body.active !== undefined) patch.active = body.active;
  if (body.order !== undefined) patch.sort_order = body.order;

  const { data, error } = await supabase
    .from('hero_slides')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/hero-slides?id=... — delete a slide
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.from('hero_slides').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
