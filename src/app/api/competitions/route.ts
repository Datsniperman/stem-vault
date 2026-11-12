import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const pool = getDbPool();

    const res = await pool.query(`
      SELECT
        c.id,
        c."guildId",
        c.title,
        c.slug,
        c.description,
        c.rules,
        c."multitrackUrl",
        c."multitrackId",
        c.deadline,
        c."earlyAccessEndsAt",
        c."publicReleaseAt",
        c."hubChannelId",
        c."adminChannelId",
        c."categoryId",
        c."hubMessageId",
        c.status,
        c."createdBy",
        c."isSpecialLinkOnly",
        c."bannerUrl",
        c."sponsorOrPrize",
        c."maxSubmissionsPerUser",
        c."createdAt",
        c."updatedAt",
        COUNT(s.id)::int AS submission_count
      FROM public."Competition" c
      LEFT JOIN public."CompetitionSubmission" s ON c.id = s."competitionId" AND s.status = 'SUBMITTED'
      WHERE c."isSpecialLinkOnly" IS NOT TRUE OR c.slug = 'christmas'
      GROUP BY c.id
      ORDER BY
        CASE c.status
          WHEN 'ACTIVE' THEN 1
          WHEN 'UPCOMING' THEN 2
          ELSE 3
        END,
        c."createdAt" DESC;
    `);

    return NextResponse.json({
      success: true,
      competitions: res.rows,
    });
  } catch (err: any) {
    console.error('[competitions/list] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to list competitions.' }, { status: 500 });
  }
}
