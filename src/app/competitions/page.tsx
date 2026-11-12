import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Disc,
  CheckCircle2,
  Lock,
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
     WHERE c."isSpecialLinkOnly" IS NOT TRUE OR c.slug = 'christmas'
     GROUP BY c.id
     ORDER BY
       CASE c.status
         WHEN 'ACTIVE' THEN 1
         WHEN 'UPCOMING' THEN 2
         ELSE 3
       END,
       c."createdAt" DESC;`
  );

  const competitions: Competition[] = compRes.rows;
  const christmasComp = competitions.find((c) => c.slug === 'christmas');
  const otherComps = competitions.filter((c) => c.slug !== 'christmas');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-24">
      <Header />

      {/* Hero Header */}
      <div className="border-b border-neutral-800 bg-neutral-950/60 backdrop-blur-sm py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>THE MIXING VAULT / COMPETITIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>Mix Competitions</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
            Test your mixing skills against community engineers. Download unreleased multitrack stems, balance your mix, and submit directly through the vault with your linked Discord account.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Featured Christmas Competition Card */}
        {christmasComp && (
          <div className="border border-red-900/60 bg-gradient-to-r from-red-950/30 via-neutral-900/40 to-neutral-950 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-lg space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded bg-red-950/70 border border-red-700/70 text-red-300 font-semibold">
                  FEATURED EVENT
                </span>
                <span className="px-2.5 py-0.5 rounded bg-amber-950/50 border border-amber-700/60 text-amber-300 flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>PLUS & PREMIUM 3-DAY EARLY ACCESS</span>
                </span>
              </div>

              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded font-bold">
                ACTIVE COMPETITION
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {christmasComp.title}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
                {christmasComp.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-neutral-800/80">
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Deadline: <strong className="text-neutral-200">{christmasComp.deadline || 'TBD (Following Sunday Service)'}</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>1 Submission Per Discord Member</span>
                </span>
              </div>

              <Link
                href="/competitions/christmas"
                className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-5 py-2.5 rounded transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                <span>Enter Christmas Competition</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Other Competitions Section */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white">All Competitions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherComps.map((comp) => (
              <Link
                key={comp.id}
                href={`/competitions/${comp.slug || comp.id}`}
                className="bg-[#121212] hover:bg-[#161616] border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 transition-all flex flex-col justify-between group shadow-xs space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-white group-hover:text-neutral-200 transition-colors line-clamp-1">
                      {comp.title}
                    </h3>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                        comp.status === 'ACTIVE'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>

                  {comp.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {comp.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                  <span>{comp.deadline ? `Deadline: ${comp.deadline}` : 'Community Comp'}</span>
                  <div className="flex items-center gap-1 text-neutral-400 group-hover:text-white transition-colors">
                    <span>View Competition</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
