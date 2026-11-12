import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import { createDbServerClient } from '@/lib/db/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';

export const dynamic = 'force-dynamic';

function getS3Client(): { s3: S3Client; bucket: string; publicBase: string } | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicBase = (process.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { s3, bucket, publicBase };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const pool = getDbPool();

    // 1. Verify user session with Discord linked account
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in with your Discord account to enter this competition.' },
        { status: 401 }
      );
    }

    const anyUser = user as any;
    const userMeta = anyUser.user_metadata || {};
    const discordId =
      anyUser.discord_id ||
      userMeta.discord_id ||
      userMeta.provider_id ||
      anyUser.sub ||
      null;

    if (!discordId) {
      return NextResponse.json(
        { error: 'A linked Discord account is required to submit. Please log in with Discord.' },
        { status: 403 }
      );
    }

    const userTag =
      userMeta.server_display_name ||
      userMeta.display_name ||
      userMeta.custom_claims?.global_name ||
      user.email?.split('@')[0] ||
      'Member';

    // 2. Fetch competition
    const compRes = await pool.query(
      `SELECT id, "guildId", title, slug, status, deadline, "adminChannelId", "hubChannelId"
       FROM public."Competition"
       WHERE slug = $1 OR id = $1
       LIMIT 1`,
      [slug]
    );

    if (compRes.rows.length === 0) {
      return NextResponse.json({ error: 'Competition not found.' }, { status: 404 });
    }

    const competition = compRes.rows[0];

    if (competition.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `This competition is currently ${competition.status.toLowerCase()} and is not accepting submissions.` },
        { status: 400 }
      );
    }

    // 3. STRICT 1-SUBMISSION CHECK
    const existingSubRes = await pool.query(
      `SELECT id, "audioFilename", "createdAt"
       FROM public."CompetitionSubmission"
       WHERE "competitionId" = $1 AND "userId" = $2 AND status = 'SUBMITTED'
       LIMIT 1`,
      [competition.id, String(discordId).trim()]
    );

    if (existingSubRes.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'You have already submitted your mix for this competition. Limit is exactly 1 submission per Discord account.',
          alreadySubmitted: true,
          existingSubmission: existingSubRes.rows[0],
        },
        { status: 400 }
      );
    }

    // 4. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const dawOrConsole = (formData.get('dawOrConsole') as string || '').trim();
    const mixNotes = (formData.get('mixNotes') as string || '').trim();

    if (!file) {
      return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 });
    }

    const originalFilename = file.name || 'mix.wav';
    const ext = path.extname(originalFilename).toLowerCase();
    const allowedExtensions = ['.wav', '.mp3', '.flac', '.aif', '.aiff', '.m4a'];

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a WAV, MP3, FLAC, or AIFF audio mix file.' },
        { status: 400 }
      );
    }

    // Max 150 MB
    if (file.size > 150 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 150MB limit.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const r2Key = `competitions/${competition.id}/${discordId}_${Date.now()}${ext}`;

    // Upload to R2 storage
    const r2Config = getS3Client();
    let audioUrl = '';

    if (r2Config) {
      await r2Config.s3.send(
        new PutObjectCommand({
          Bucket: r2Config.bucket,
          Key: r2Key,
          Body: buffer,
          ContentType: file.type || 'audio/wav',
        })
      );
      audioUrl = `${r2Config.publicBase}/${r2Key}`;
    } else {
      audioUrl = `/api/storage/raw/${encodeURIComponent(r2Key)}`;
    }

    // 5. Insert submission record
    const submissionId = crypto.randomUUID();
    const insertRes = await pool.query(
      `INSERT INTO public."CompetitionSubmission" (
        id,
        "competitionId",
        "guildId",
        "userId",
        "userTag",
        "profileId",
        "audioUrl",
        "audioFilename",
        "audioFilesize",
        "r2Key",
        "dawOrConsole",
        "mixNotes",
        status,
        "createdAt",
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'SUBMITTED', NOW(), NOW())
      RETURNING id, "audioUrl", "audioFilename", "audioFilesize", "dawOrConsole", "mixNotes", status, "createdAt"`,
      [
        submissionId,
        competition.id,
        competition.guildId,
        String(discordId).trim(),
        userTag,
        user.id,
        audioUrl,
        originalFilename,
        file.size,
        r2Key,
        dawOrConsole || 'Not specified',
        mixNotes || null,
      ]
    );

    const newSubmission = insertRes.rows[0];

    // 6. Optional: Post Discord announcement / log to staff channel
    try {
      const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
      if (botToken && competition.adminChannelId) {
        const cleanToken = botToken.trim().replace(/^["']|["']$/g, '').replace(/^Bot\s+/i, '');
        const fields = [
          { name: 'Competition', value: competition.title, inline: true },
          { name: 'Engineer', value: `<@${discordId}> (${userTag})`, inline: true },
          { name: 'File', value: `${originalFilename} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`, inline: true },
        ];
        if (dawOrConsole) {
          fields.push({ name: 'DAW / Console', value: dawOrConsole, inline: true });
        }
        if (mixNotes) {
          fields.push({ name: 'Mix Notes', value: mixNotes.slice(0, 1024), inline: false });
        }

        await fetch(`https://discord.com/api/v10/channels/${competition.adminChannelId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${cleanToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `New mix submission received for **${competition.title}** from <@${discordId}>!`,
            embeds: [
              {
                title: 'New Competition Mix Submitted',
                color: 0x10b981,
                fields,
                footer: { text: 'Mixing Vault Competition Engine - 1 Submission Limit Enforced' },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      }
    } catch (discordErr: any) {
      console.warn('[Competition Submit] Could not post Discord notification:', discordErr?.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Your mix has been successfully submitted! Exactly 1 submission is permitted per member.',
      submission: newSubmission,
    });
  } catch (err: any) {
    console.error('[competition/submit] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit mix.' }, { status: 500 });
  }
}
