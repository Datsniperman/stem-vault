import React from 'react';
import { notFound } from 'next/navigation';
import { getDbPool } from '@/lib/db/pool';
import { CompetitionDetailClient } from '@/components/CompetitionDetailClient';
import { Competition } from '@/types';

export const dynamic = 'force-dynamic';

interface CompetitionPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CompetitionDetailPage({ params }: CompetitionPageProps) {
  const { slug } = await params;
  const pool = getDbPool();

  const compRes = await pool.query(
    `SELECT
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
     WHERE c.slug = $1 OR c.id = $1
     GROUP BY c.id
     LIMIT 1`,
    [slug]
  );

  if (compRes.rows.length === 0) {
    notFound();
  }

  const competition: Competition = compRes.rows[0];

  return <CompetitionDetailClient initialCompetition={competition} slug={slug} />;
}
