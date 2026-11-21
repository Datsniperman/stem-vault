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
import { FluidOrb } from '@/components/ui/fluid-orb';

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
    <div className="min-h-screen bg-[#0d0d0e] text-neutral-100 pb-24">
      <Header />

      {/* Rare UI Hero Canvas */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-6">
        <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#121215]/80 backdrop-blur-xl p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
          <div className="absolute -right-20 -top-20 opacity-20 blur-2xl pointer-events-none">
            <FluidOrb size={320} color="#353540" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
              <span>THE MIXING VAULT / COMPETITIONS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-neutral-300" />
              <span>Mix Competitions</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
              Test your mixing skills against community engineers. Download multitrack stems, balance your mix, and submit directly through the vault with your linked Discord account.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-8">
        {competition ? (
          <div className="rare-card p-7 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300">
                  FEATURED EVENT
                </span>
              </div>

              <span className="text-[11px] font-mono text-neutral-300 bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-full">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {competition.title}
              </h2>
              {competition.description && (
                <p className="text-xs sm:text-sm text-neutral-400 max-w-3xl leading-relaxed">
                  {competition.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-white/[0.06]">
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Deadline: <strong className="text-neutral-200">{competition.deadline || 'TBD (Following Sunday Service)'}</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Limit is 1 submission per User</span>
                </span>
              </div>

              <Link
                href={`/competitions/${competition.slug || competition.id}`}
                className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-5 py-2.5 rounded-full transition-all inline-flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Enter Competition</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-white/[0.08] p-12 text-center text-xs text-neutral-500 bg-[#141416]/60 backdrop-blur-xl">
            No active competitions at this time.
          </div>
        )}
      </div>
    </div>
  );
}
