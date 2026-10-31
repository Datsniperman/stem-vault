import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { deleteBlob } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawKeys: (string | undefined)[] = [
      body.key,
      ...(Array.isArray(body.keys) ? body.keys : []),
    ];
    const keys = rawKeys.filter((k): k is string => typeof k === 'string' && k.trim().length > 0);

    if (keys.length === 0) {
      return NextResponse.json({ message: 'No keys provided to delete.' });
    }

    const deleted: string[] = [];
    for (const key of keys) {
      // Ensure the key belongs to the current user, or user is admin
      const isOwnerKey = key.includes(`/${user.id}/`);
      const isAdmin = (user as any).role === 'admin';

      if (isOwnerKey || isAdmin) {
        try {
          await deleteBlob(key);
          deleted.push(key);
        } catch (delErr) {
          console.warn(`[storage/delete] Failed to delete key ${key}:`, delErr);
        }
      }
    }

    return NextResponse.json({ success: true, deletedCount: deleted.length, deleted });
  } catch (err: any) {
    console.error('[storage/delete] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete storage objects.' }, { status: 500 });
  }
}
