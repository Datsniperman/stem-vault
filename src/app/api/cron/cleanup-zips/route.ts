import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import { deleteBlob } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/**
 * Retention Policy: Safe archive preservation (365 days rolling retention).
 * Preserves pre-packaged multi ZIPs to ensure instantaneous direct CDN downloads.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();

    // Only clean up archives that have not been downloaded in 365 days
    const expiredRes = await pool.query(
      `SELECT id, title, zip_r2_key, zip_size_bytes, zip_last_downloaded_at, created_at
       FROM public.multis
       WHERE zip_r2_key IS NOT NULL
         AND (
           zip_last_downloaded_at < NOW() - INTERVAL '365 days'
           OR (zip_last_downloaded_at IS NULL AND created_at < NOW() - INTERVAL '365 days')
         )`
    );

    const purged: Array<{ id: string; title: string; sizeBytes: number; key: string }> = [];
    let totalSavedBytes = 0;

    for (const row of expiredRes.rows) {
      if (row.zip_r2_key) {
        try {
          await deleteBlob(row.zip_r2_key);
          const size = Number(row.zip_size_bytes) || 0;
          totalSavedBytes += size;
          purged.push({
            id: row.id,
            title: row.title,
            sizeBytes: size,
            key: row.zip_r2_key,
          });

          // Mark expired and remove zip references in database
          await pool.query(
            `UPDATE public.multis
             SET zip_r2_key = NULL,
                 zip_public_url = NULL,
                 zip_size_bytes = NULL,
                 zip_status = 'expired'
             WHERE id = $1`,
            [row.id]
          );
        } catch (delErr: any) {
          console.warn(`[cleanup-zips] Error deleting zip ${row.zip_r2_key} for multi ${row.id}:`, delErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${purged.length} expired ZIP archive(s).`,
      purgedCount: purged.length,
      savedBytes: totalSavedBytes,
      savedMegabytes: Math.round((totalSavedBytes / (1024 * 1024)) * 100) / 100,
      purged,
    });
  } catch (err: any) {
    console.error('[cleanup-zips] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
