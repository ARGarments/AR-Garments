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

// GET /api/products/[id]/variants — fetch all variants for a product
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch variants error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Error in GET /api/products/[id]/variants:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/products/[id]/variants — update an existing variant
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const body = await req.json();
    const variantId = body.id || body.variant_id;
    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID required for update' }, { status: 400 });
    }

    const supabase = getAdminClient();

    const record = {
      variant_type: body.variant_type || body.variantType || 'set_size',
      size: body.size || 'Free Size',
      pieces_per_set: Number(body.pieces_per_set ?? body.piecesPerSet) || 1,
      price_per_piece: Number(body.price_per_piece ?? body.pricePerPiece) || 0,
      total_set_price: Number(body.total_set_price ?? body.totalSetPrice) || 0,
      available_sets: Number(body.available_sets ?? body.availableSets) || 0,
      total_stock_pieces: Number(body.total_stock_pieces ?? body.totalStockPieces) || 0,
      available_pieces: Number(body.available_pieces ?? body.availablePieces) || 0,
      weight: String(body.weight || ''),
      weight_unit: String(body.weight_unit || body.weightUnit || 'kg'),
      gst_rate: String(body.gst_rate || body.gstRate || '5%'),
      sku_id: String(body.sku_id || body.skuId || ''),
      purchase_price: Number(body.purchase_price ?? body.purchasePrice) || 0,
      hsn_code: String(body.hsn_code || body.hsnCode || ''),
      colour: String(body.colour || ''),
      fabric: String(body.fabric || ''),
      work: String(body.work || ''),
      fit_shape: String(body.fit_shape || body.fitShape || ''),
      sleeve_length: String(body.sleeve_length || body.sleeveLength || ''),
      length: String(body.length || ''),
      occasion: String(body.occasion || ''),
      description: String(body.description || ''),
      images: Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []),
      size_chart: body.size_chart || body.sizeChart || null,
      custom_specifications: Array.isArray(body.custom_specifications)
        ? body.custom_specifications
        : (body.customSpecifications || []),
    };

    const { data, error } = await supabase
      .from('product_variants')
      .update(record)
      .eq('id', variantId)
      .eq('product_id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Update variant error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error in PUT /api/products/[id]/variants:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/products/[id]/variants — add or sync variants for a product
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const body = await req.json();
    const supabase = getAdminClient();

    // Support single variant or array of variants
    const rawList = Array.isArray(body) ? body : [body];

    const records = rawList.map((v) => ({
      product_id: id,
      variant_type: v.variant_type || v.variantType || 'set_size',
      size: v.size || 'Free Size',
      pieces_per_set: Number(v.pieces_per_set ?? v.piecesPerSet) || 1,
      price_per_piece: Number(v.price_per_piece ?? v.pricePerPiece) || 0,
      total_set_price: Number(v.total_set_price ?? v.totalSetPrice) || 0,
      available_sets: Number(v.available_sets ?? v.availableSets) || 0,
      total_stock_pieces: Number(v.total_stock_pieces ?? v.totalStockPieces) || 0,
      available_pieces: Number(v.available_pieces ?? v.availablePieces) || 0,
      weight: String(v.weight || ''),
      weight_unit: String(v.weight_unit || v.weightUnit || 'kg'),
      gst_rate: String(v.gst_rate || v.gstRate || '5%'),
      sku_id: String(v.sku_id || v.skuId || ''),
      purchase_price: Number(v.purchase_price ?? v.purchasePrice) || 0,
      hsn_code: String(v.hsn_code || v.hsnCode || ''),
      colour: String(v.colour || ''),
      fabric: String(v.fabric || ''),
      work: String(v.work || ''),
      fit_shape: String(v.fit_shape || v.fitShape || ''),
      sleeve_length: String(v.sleeve_length || v.sleeveLength || ''),
      length: String(v.length || ''),
      occasion: String(v.occasion || ''),
      description: String(v.description || ''),
      images: Array.isArray(v.images) ? v.images : (v.image ? [v.image] : []),
      size_chart: v.size_chart || v.sizeChart || null,
      custom_specifications: Array.isArray(v.custom_specifications)
        ? v.custom_specifications
        : (v.customSpecifications || []),
    }));

    const { data, error } = await supabase
      .from('product_variants')
      .insert(records)
      .select('*');

    if (error) {
      console.error('Insert variants error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 201 });
  } catch (err) {
    console.error('Error in POST /api/products/[id]/variants:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/products/[id]/variants — delete all variants or a specific one
// ?variant_id=xxx  → delete single variant
// (no query param)  → delete ALL variants for this product (used before re-saving)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get('variant_id');

    const supabase = getAdminClient();

    if (variantId) {
      // Delete specific variant
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId)
        .eq('product_id', id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      // Delete ALL variants for this product (called before re-saving full list)
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/products/[id]/variants:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
