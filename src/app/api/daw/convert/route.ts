import { NextRequest, NextResponse } from 'next/server';
import {
  generateReaperProject,
  generateAbletonProject,
  generateDawproject,
  DawProjectOptions,
} from '@/lib/daw';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, bpm, timeSignatureNumerator, timeSignatureDenominator, tracks, targetFormat } =
      body;

    if (!title || !tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one track are required.' },
        { status: 400 }
      );
    }

    const options: DawProjectOptions = {
      title: String(title).trim(),
      bpm: bpm ? Number(bpm) : 120,
      timeSignatureNumerator: timeSignatureNumerator ? Number(timeSignatureNumerator) : 4,
      timeSignatureDenominator: timeSignatureDenominator ? Number(timeSignatureDenominator) : 4,
      tracks: tracks.map((t: any) => ({
        name: String(t.name || t.filename || 'Track').trim(),
        filename: String(t.filename || t.name || 'track.wav').trim(),
        durationSeconds: t.durationSeconds ? Number(t.durationSeconds) : undefined,
      })),
    };

    const format = String(targetFormat || 'reaper').toLowerCase();
    const safeTitle = options.title.replace(/[^a-zA-Z0-9_-]/g, '_');

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
      { error: 'Unsupported target format. Supported: reaper, ableton, dawproject' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[daw/convert] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
