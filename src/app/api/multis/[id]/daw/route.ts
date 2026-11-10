import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import { createDbServerClient } from '@/lib/db/server';
import { canAccessProMultitracks } from '@/lib/auth/tiers';
import {
  generateReaperProject,
  generateAbletonProject,
  generateDawproject,
  DawProjectOptions,
} from '@/lib/daw';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'reaper').toLowerCase();

    const pool = getDbPool();

    // 1. Fetch Multi
    const multiRes = await pool.query(
      `SELECT id, title, is_pro FROM public.multis WHERE id = $1`,
      [id]
    );

    if (multiRes.rows.length === 0) {
      return NextResponse.json({ error: 'Multi not found' }, { status: 404 });
    }

    const multi = multiRes.rows[0];

    // Gating check for Pro Multitracks
    if (multi.is_pro) {
      const db = await createDbServerClient();
      const { data: { user } } = await db.auth.getUser();

      if (!user || !canAccessProMultitracks(user)) {
        return NextResponse.json(
          {
            error: 'DAW templates for Pro Multitracks are exclusive to Premium Tier members.',
            requiredTier: 'PREMIUM',
            upgradeUrl: '/membership',
          },
          { status: 403 }
        );
      }
    }

    const safeTitle = (multi.title || 'multitrack').replace(/[^a-zA-Z0-9_-]/g, '_');

    // 2. Fetch Tracks
    const tracksRes = await pool.query(
      `SELECT stored_filename, original_filename, duration_seconds
       FROM public.multi_tracks
       WHERE multi_id = $1
       ORDER BY stored_filename ASC`,
      [id]
    );

    if (tracksRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'No audio tracks found for this multitrack session.' },
        { status: 400 }
      );
    }

    const options: DawProjectOptions = {
      title: multi.title,
      bpm: 120, // default if not specified
      tracks: tracksRes.rows.map((t) => ({
        name: (t.original_filename || t.stored_filename).replace(/\.[a-zA-Z0-9]+$/, ''),
        filename: t.stored_filename,
        durationSeconds: t.duration_seconds ? Number(t.duration_seconds) : undefined,
      })),
    };

    if (format === 'reaper' || format === 'rpp') {
      const rpp = generateReaperProject(options);
      return new NextResponse(rpp, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-reaper-project',
          'Content-Disposition': `attachment; filename="${safeTitle}.rpp"`,
        },
      });
    }

    if (format === 'ableton' || format === 'als') {
      const als = generateAbletonProject(options);
      return new NextResponse(new Uint8Array(als), {
        status: 200,
        headers: {
          'Content-Type': 'application/x-ableton-live-set',
          'Content-Disposition': `attachment; filename="${safeTitle}.als"`,
        },
      });
    }

    if (format === 'dawproject') {
      const dp = await generateDawproject(options);
      return new NextResponse(new Uint8Array(dp), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.presonus.dawproject',
          'Content-Disposition': `attachment; filename="${safeTitle}.dawproject"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Unsupported format. Supported: reaper, ableton, dawproject' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[multis/daw] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
