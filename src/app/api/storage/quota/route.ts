import { isUserAdmin } from '@/lib/auth/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import {
  getR2ConfigStatus,
  getUserStorageUsed,
  getGlobalStorageUsed,
  USER_BETA_CAP_BYTES,
  GLOBAL_BETA_LIMIT_BYTES,
} from '@/lib/storage';

export async function GET(_request: NextRequest) {
  try {
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    const r2Status = getR2ConfigStatus();
    const globalUsed = await getGlobalStorageUsed();
    const userUsed = user ? await getUserStorageUsed(user.id) : 0;

    return NextResponse.json({
      user_bytes_used: userUsed,
      user_bytes_limit: -1,
      user_percent: 0,
      global_bytes_used: globalUsed,
      global_bytes_limit: -1,
      global_percent: 0,
      global_warning: false,
      is_unlimited: true,
      is_r2_active: r2Status.isConfigured,
      missing_r2_keys: r2Status.missingKeys,
    });
  } catch (err: any) {
    console.error('[storage/quota] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
