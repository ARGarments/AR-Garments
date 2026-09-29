import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// POST /api/upload — upload file to ImageKit
export async function POST(req: NextRequest) {
  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: 'ImageKit private key is not configured' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const folder = (formData.get('folder') as string) || '/categories';
    const customFileName = formData.get('fileName') as string | null;

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No valid image file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const fileName = customFileName || (file as File).name || `img_${Date.now()}.jpg`;

    // Forward to ImageKit Upload REST API
    const ikFormData = new FormData();
    ikFormData.append('file', base64Data);
    ikFormData.append('fileName', fileName);
    ikFormData.append('folder', folder);
    ikFormData.append('useUniqueFileName', 'true');
    ikFormData.append('tags', 'sari-ecommerce,category');

    const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');

    const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
      body: ikFormData,
    });

    const data = await ikRes.json();

    if (!ikRes.ok) {
      console.error('ImageKit upload error response:', data);
      return NextResponse.json(
        { error: data.message || 'ImageKit upload failed' },
        { status: ikRes.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.url,
      fileId: data.fileId,
      name: data.name,
      thumbnailUrl: data.thumbnailUrl,
    });
  } catch (err: unknown) {
    console.error('Error in /api/upload:', err);
    const msg = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
