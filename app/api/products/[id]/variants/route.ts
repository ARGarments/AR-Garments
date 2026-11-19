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

    // Partial update support: Only build fields that are explicitly provided in request body
    const record: Record<string, unknown> = {};

    if (body.variant_type !== undefined || body.variantType !== undefined) {
      record.variant_type = body.variant_type || body.variantType || 'set_size';
    }
    if (body.size !== undefined) record.size = body.size;
    if (body.pieces_per_set !== undefined || body.piecesPerSet !== undefined) {
      record.pieces_per_set = Number(body.pieces_per_set ?? body.piecesPerSet) || 1;
    }
    if (body.price_per_piece !== undefined || body.pricePerPiece !== undefined) {
      record.price_per_piece = Number(body.price_per_piece ?? body.pricePerPiece) || 0;
    }
    if (body.total_set_price !== undefined || body.totalSetPrice !== undefined) {
      record.total_set_price = Number(body.total_set_price ?? body.totalSetPrice) || 0;
    }
    if (body.available_sets !== undefined || body.availableSets !== undefined) {
      record.available_sets = Number(body.available_sets ?? body.availableSets) || 0;
    }
    if (body.total_stock_pieces !== undefined || body.totalStockPieces !== undefined) {
      record.total_stock_pieces = Number(body.total_stock_pieces ?? body.totalStockPieces) || 0;
    }
    if (body.available_pieces !== undefined || body.availablePieces !== undefined) {
      record.available_pieces = Number(body.available_pieces ?? body.availablePieces) || 0;
    }
    if (body.weight !== undefined) record.weight = String(body.weight || '');
    if (body.weight_unit !== undefined || body.weightUnit !== undefined) {
      record.weight_unit = String(body.weight_unit || body.weightUnit || 'kg');
    }
    if (body.gst_rate !== undefined || body.gstRate !== undefined) {
      record.gst_rate = String(body.gst_rate || body.gstRate || '5%');
    }
    if (body.sku_id !== undefined || body.skuId !== undefined) {
      record.sku_id = String(body.sku_id || body.skuId || '');
    }
    if (body.purchase_price !== undefined || body.purchasePrice !== undefined) {
      record.purchase_price = Number(body.purchase_price ?? body.purchasePrice) || 0;
    }
    if (body.hsn_code !== undefined || body.hsnCode !== undefined) {
      record.hsn_code = String(body.hsn_code || body.hsnCode || '');
    }
    if (body.colour !== undefined) record.colour = String(body.colour || '').trim();
    if (body.fabric !== undefined) record.fabric = String(body.fabric || '').trim();
    if (body.work !== undefined) record.work = String(body.work || '').trim();
    if (body.fit_shape !== undefined || body.fitShape !== undefined) {
      record.fit_shape = String(body.fit_shape || body.fitShape || '').trim();
    }
    if (body.sleeve_length !== undefined || body.sleeveLength !== undefined) {
      record.sleeve_length = String(body.sleeve_length || body.sleeveLength || '').trim();
    }
    if (body.length !== undefined) record.length = String(body.length || '').trim();
    if (body.occasion !== undefined) record.occasion = String(body.occasion || '').trim();
    if (body.description !== undefined) record.description = String(body.description || '');
    if (body.images !== undefined || body.image !== undefined) {
      record.images = Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []);
    }
    if (body.size_chart !== undefined || body.sizeChart !== undefined) {
      record.size_chart = body.size_chart || body.sizeChart || null;
    }
    if (body.custom_specifications !== undefined || body.customSpecifications !== undefined) {
      record.custom_specifications = Array.isArray(body.custom_specifications)
        ? body.custom_specifications
        : (body.customSpecifications || []);
    }
    if (body.youtube_url !== undefined || body.youtubeUrl !== undefined) {
      record.youtube_url = String(body.youtube_url || body.youtubeUrl || '');
    }
    if (body.facebook_url !== undefined || body.facebookUrl !== undefined) {
      record.facebook_url = String(body.facebook_url || body.facebookUrl || '');
    }
    if (body.instagram_url !== undefined || body.instagramUrl !== undefined) {
      record.instagram_url = String(body.instagram_url || body.instagramUrl || '');
    }
    if (body.delivery_type !== undefined || body.deliveryType !== undefined) {
      record.delivery_type = body.delivery_type || body.deliveryType || 'standard';
    }
    if (body.delivery_charge_amount !== undefined || body.deliveryChargeAmount !== undefined) {
      record.delivery_charge_amount = Number(body.delivery_charge_amount ?? body.deliveryChargeAmount) || 0;
    }
    if (body.is_non_returnable !== undefined || body.isNonReturnable !== undefined) {
      record.is_non_returnable = Boolean(body.is_non_returnable ?? body.isNonReturnable);
    }
    if (body.is_new_arrival !== undefined || body.isNewArrival !== undefined) {
      record.is_new_arrival = Boolean(body.is_new_arrival ?? body.isNewArrival);
    }
    if (body.is_best_seller !== undefined || body.isBestSeller !== undefined) {
      record.is_best_seller = Boolean(body.is_best_seller ?? body.isBestSeller);
    }
    if (body.is_premium !== undefined || body.isPremium !== undefined) {
      record.is_premium = Boolean(body.is_premium ?? body.isPremium);
    }
    if (body.is_gold !== undefined || body.isGold !== undefined) {
      record.is_gold = Boolean(body.is_gold ?? body.isGold);
    }
    if (body.tags !== undefined) {
      record.tags = Array.isArray(body.tags) ? body.tags : [];
    }
    if (body.active !== undefined) {
      record.active = body.active !== false;
    }

    if (Object.keys(record).length === 0) {
      return NextResponse.json({ error: 'No fields provided to update.' }, { status: 400 });
    }

    // Guard: Only validate colour/images if full creation or if both colour and images were explicitly submitted as empty
    if (
      body.colour !== undefined &&
      (body.images !== undefined || body.image !== undefined) &&
      !record.colour &&
      (!record.images || (Array.isArray(record.images) && record.images.length === 0))
    ) {
      return NextResponse.json({ error: 'Cannot save an empty variant. Colour or Images required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('product_variants')
      .update(record)
      .eq('id', variantId)
      .eq('product_id', id)
      .select('*');

    if (error) {
      console.error('Update variant error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      // The variant with this ID didn't exist in DB.
      // Only do an INSERT fallback if full variant creation fields are present (e.g. colour or fabric).
      // If this is just a partial update (like an image edit or delete), DO NOT insert an empty shell variant!
      if (!record.colour && !record.fabric && !record.price_per_piece) {
        return NextResponse.json({ error: `Variant ${variantId} not found to update.` }, { status: 404 });
      }

      console.warn(`Variant ${variantId} not found for update, inserting as new variant`);
      const { data: inserted, error: insertError } = await supabase
        .from('product_variants')
        .insert([{
          product_id: id,
          ...record,
        }])
        .select('*')
        .single();

      if (insertError) {
        console.error('Insert fallback error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json(inserted);
    }

    return NextResponse.json(data[0]);
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
      size: v.size || '',
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
      youtube_url: String(v.youtube_url || v.youtubeUrl || ''),
      facebook_url: String(v.facebook_url || v.facebookUrl || ''),
      instagram_url: String(v.instagram_url || v.instagramUrl || ''),
      delivery_type: v.delivery_type || v.deliveryType || 'standard',
      delivery_charge_amount: Number(v.delivery_charge_amount ?? v.deliveryChargeAmount) || 0,
      is_non_returnable: Boolean(v.is_non_returnable ?? v.isNonReturnable),
      is_new_arrival: Boolean(v.is_new_arrival ?? v.isNewArrival),
      is_best_seller: Boolean(v.is_best_seller ?? v.isBestSeller),
      is_premium: Boolean(v.is_premium ?? v.isPremium),
      is_gold: Boolean(v.is_gold ?? v.isGold),
      tags: Array.isArray(v.tags) ? v.tags : [],
      active: v.active !== false,
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
