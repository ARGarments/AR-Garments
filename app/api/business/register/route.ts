import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { hashPassword, memoryUsers } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/business/register
// Accepts multipart/form-data with all business registration fields + doc file
// Stores directly into business_registrations (users table is dropped/not used)
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    let fullName = '';
    let mobile = '';
    let email = '';
    let password = '';
    let shopAddress = '';
    let landmark = '';
    let city = '';
    let state = '';
    let pincode = '';
    let businessType = 'retail_store';
    let hasGstin = false;
    let gstin = '';
    let directDocUrl = '';
    let docFile: File | null = null;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await req.json();
      fullName     = String(json.fullName || json.full_name || '').trim();
      mobile       = String(json.mobile || '').trim();
      email        = String(json.email || json.applicant_email || '').trim().toLowerCase();
      password     = String(json.password || '').trim();
      shopAddress  = String(json.shopAddress || json.shop_address || '').trim();
      landmark     = String(json.landmark || '').trim();
      city         = String(json.city || '').trim();
      state        = String(json.state || '').trim();
      pincode      = String(json.pincode || '').trim();
      businessType = String(json.businessType || json.business_type || 'retail_store').trim();
      hasGstin     = Boolean(json.hasGstin || json.has_gstin);
      gstin        = String(json.gstin || '').trim();
      directDocUrl = String(json.verificationDocUrl || json.document_url || '').trim();
    } else {
      const formData = await req.formData();
      fullName     = (formData.get('full_name') as string)?.trim() || (formData.get('fullName') as string)?.trim();
      mobile       = (formData.get('mobile') as string)?.trim();
      email        = (formData.get('email') as string)?.trim().toLowerCase();
      password     = (formData.get('password') as string)?.trim();
      shopAddress  = (formData.get('shop_address') as string)?.trim() || (formData.get('shopAddress') as string)?.trim();
      landmark     = (formData.get('landmark') as string)?.trim() || '';
      city         = (formData.get('city') as string)?.trim();
      state        = (formData.get('state') as string)?.trim();
      pincode      = (formData.get('pincode') as string)?.trim();
      businessType = (formData.get('business_type') as string)?.trim() || (formData.get('businessType') as string)?.trim() || 'retail_store';
      hasGstin     = formData.get('has_gstin') === 'true' || formData.get('hasGstin') === 'true';
      gstin        = (formData.get('gstin') as string)?.trim() || '';
      directDocUrl = (formData.get('document_url') as string)?.trim() || (formData.get('verificationDocUrl') as string)?.trim() || '';
      docFile      = formData.get('document') as File | null;
    }

    // ── Validation ───────────────────────────────────────────────────────────
    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: 'Please enter a valid full name.' }, { status: 400 });
    }
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }
    if (!shopAddress) {
      return NextResponse.json({ error: 'Please enter your shop address.' }, { status: 400 });
    }
    if (!city) {
      return NextResponse.json({ error: 'Please enter your city.' }, { status: 400 });
    }
    if (!state) {
      return NextResponse.json({ error: 'Please select your state.' }, { status: 400 });
    }
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: 'Please enter a valid 6-digit PIN code.' }, { status: 400 });
    }
    if (!['retail_store', 'hawker'].includes(businessType)) {
      return NextResponse.json({ error: 'Please select a valid business type.' }, { status: 400 });
    }
    if (hasGstin && gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
      return NextResponse.json({ error: 'Please enter a valid 15-digit GSTIN number.' }, { status: 400 });
    }
    if (!directDocUrl && !docFile) {
      return NextResponse.json({ error: 'Please upload a verification document photo.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // ── Check for duplicate in business_registrations ────────────────────────
    try {
      const { data: existingBiz } = await supabase
        .from('business_registrations')
        .select('id, status')
        .eq('applicant_email', email)
        .maybeSingle();

      if (existingBiz) {
        const statusMsg =
          existingBiz.status === 'pending'
            ? 'A registration with this email is already under review. Please wait for admin approval.'
            : existingBiz.status === 'approved'
            ? 'This email is already registered and approved. Please log in.'
            : 'A previous registration with this email was rejected. Please contact support.';
        return NextResponse.json({ error: statusMsg, code: 'ALREADY_REGISTERED' }, { status: 409 });
      }
    } catch {
      // Ignore if table not yet created
    }

    // ── Document URL (pre-uploaded client-side, or fallback server-side upload) ──
    let documentUrl = directDocUrl;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    if (!documentUrl && docFile && privateKey) {
      try {
        const buffer   = Buffer.from(await docFile.arrayBuffer());
        const base64   = buffer.toString('base64');
        const fileName = `business_doc_${email.replace(/[^a-z0-9]/g, '_')}_${Date.now()}.jpg`;

        const ikForm = new FormData();
        ikForm.append('file', base64);
        ikForm.append('fileName', fileName);
        ikForm.append('folder', '/business-docs');
        ikForm.append('useUniqueFileName', 'true');
        ikForm.append('tags', 'business-registration,verification');

        const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          headers: { Authorization: 'Basic ' + Buffer.from(privateKey + ':').toString('base64') },
          body: ikForm,
        });
        const ikData = await ikRes.json();
        if (ikRes.ok && ikData.url) {
          documentUrl = ikData.url;
        }
      } catch (uploadErr) {
        console.error('ImageKit fallback upload failed for business doc:', uploadErr);
      }
    }

    // ── Hash password ────────────────────────────────────────────────────────
    const hashedPassword = hashPassword(password);

    // ── Insert directly into business_registrations table ───────────────────
    let registrationId: string = `biz-${Date.now()}`;
    try {
      const { data: inserted, error: insertError } = await supabase
        .from('business_registrations')
        .insert({
          full_name: fullName,
          mobile,
          applicant_email: email,
          password: hashedPassword,
          shop_address: shopAddress,
          landmark,
          city,
          state,
          pincode,
          business_type: businessType,
          has_gstin: hasGstin,
          gstin: hasGstin ? gstin : '',
          document_url: documentUrl,
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('business_registrations insert error:', insertError);
      } else if (inserted?.id) {
        registrationId = inserted.id;
      }
    } catch (bizErr) {
      console.warn('business_registrations DB error:', bizErr);
    }

    // Also store in memory fallback with status 'pending'
    const memUser = {
      id: registrationId,
      name: fullName,
      email,
      phone: mobile,
      passwordHash: hashedPassword,
      userType: 'business' as const,
      businessStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    const existingMemIndex = memoryUsers.findIndex((u) => u.email.toLowerCase() === email);
    if (existingMemIndex >= 0) {
      memoryUsers[existingMemIndex] = memUser;
    } else {
      memoryUsers.push(memUser);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration submitted successfully! Your application is under review.',
        id: registrationId,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/business/register] Error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
