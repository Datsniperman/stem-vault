import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { getDbPool } from '@/lib/db/pool';
import { Competition } from '@/types';

export const dynamic = 'force-dynamic';

export default async function CompetitionsPage() {
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
      c.status,
      c."sponsorOrPrize",
      c."createdAt",
      COUNT(s.id)::int AS submission_count
     FROM public."Competition" c
     LEFT JOIN public."CompetitionSubmission" s ON c.id = s."competitionId" AND s.status = 'SUBMITTED'
     WHERE c.status = 'ACTIVE' OR c.slug = 'christmas'
     GROUP BY c.id
     ORDER BY c."createdAt" DESC
     LIMIT 1;`
  );

  const competition: Competition | undefined = compRes.rows[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-24">
      <Header />

      {/* Hero Header */}
      <div className="border-b border-neutral-800 bg-[#0d0d0e] py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            <span>THE MIXING VAULT / COMPETITIONS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-neutral-300" />
            <span>Mix Competitions</span>
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Test your mixing skills against community engineers. Download multitrack stems, balance your mix, and submit directly through the vault with your linked Discord account.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {competition ? (
          <div className="bg-[#121212] border border-neutral-800 rounded-xl p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                  FEATURED EVENT
                </span>
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-neutral-400" />
                  <span>PLUS & PREMIUM 3-DAY EARLY ACCESS</span>
                </span>
              </div>

              <span className="text-[11px] font-mono text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {competition.title}
              </h2>
              {competition.description && (
                <p className="text-xs sm:text-sm text-neutral-400 max-w-3xl leading-relaxed">
                  {competition.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-800/80">
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Deadline: <strong className="text-neutral-200">{competition.deadline || 'TBD (Following Sunday Service)'}</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>1 Submission Per Discord Member</span>
                </span>
              </div>

              <Link
                href={`/competitions/${competition.slug || competition.id}`}
                className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2 rounded transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                <span>Enter Competition</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="border border-neutral-800 rounded-xl p-12 text-center text-xs text-neutral-500 bg-[#121212]">
            No active competitions at this time.
          </div>
        )}
      </div>
    </div>
  );
}
