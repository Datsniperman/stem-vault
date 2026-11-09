import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

function getS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function PUT(request: NextRequest) {
  try {
    const db = await createDbServerClient();
    const {
      data: { user },
    } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    const contentType = request.headers.get('content-type') || 'application/octet-stream';

    if (!request.body) {
      return NextResponse.json({ error: 'No data stream provided' }, { status: 400 });
    }

    const nodeStream = Readable.fromWeb(request.body as any);
    const s3 = getS3Client();

    // Use lib-storage Upload to handle arbitrary stream sizes without Content-Length header mismatch
    const parallelUpload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: nodeStream,
        ContentType: contentType,
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 5, // 5MB parts
      leavePartsOnError: false,
    });

    await parallelUpload.done();

    const publicBase = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
    const publicUrl = `${publicBase}/${key}`;

    return NextResponse.json({ success: true, key, publicUrl });
  } catch (err: any) {
    console.error('[storage/upload] Error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}

export const POST = PUT;
