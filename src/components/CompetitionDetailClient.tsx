'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Calendar,
  Clock,
  Download,
  Music2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  ArrowLeft,
  Sliders,
  FileAudio,
  User,
  ShieldCheck,
  Info,
  Loader2,
  UploadCloud,
  Check,
  Disc,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Competition } from '@/types';

interface CompetitionDetailClientProps {
  initialCompetition: Competition;
  slug: string;
}

export function CompetitionDetailClient({
  initialCompetition,
  slug,
}: CompetitionDetailClientProps) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [competition, setCompetition] = useState<Competition>(initialCompetition);
  const [loading, setLoading] = useState(false);
  const [userState, setUserState] = useState<{
    isLoggedIn: boolean;
    discordId: string | null;
    username: string | null;
    hasEarlyAccess: boolean;
    hasSubmitted: boolean;
    submission: any;
    isEarlyAccessActive: boolean;
    canDownload: boolean;
  }>({
    isLoggedIn: Boolean(user),
    discordId: null,
    username: null,
    hasEarlyAccess: false,
    hasSubmitted: false,
    submission: null,
    isEarlyAccessActive: false,
    canDownload: true,
  });

  // Submission form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dawOrConsole, setDawOrConsole] = useState('');
  const [mixNotes, setMixNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCompetitionData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/competitions/${slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.competition) setCompetition(data.competition);
        if (data.userState) setUserState(data.userState);
      }
    } catch (e) {
      console.warn('Could not refresh competition:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitionData();
  }, [slug, user]);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setSelectedFile(f);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmitMix = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      addToast('Please select your audio mix file to upload.', 'error');
      return;
    }

    if (!confirm('Are you sure you want to submit this mix? Exactly 1 submission per Discord account is permitted and submissions are final.')) {
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('dawOrConsole', dawOrConsole);
      formData.append('mixNotes', mixNotes);

      const res = await fetch(`/api/competitions/${slug}/submit`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        addToast(data.error || 'Failed to submit mix.', 'error');
        return;
      }

      addToast('Mix successfully submitted! Exactly 1 submission is allowed per member.', 'success');
      setSubmitSuccess(true);
      fetchCompetitionData();
    } catch (err: any) {
      addToast(err.message || 'Error uploading submission.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isChristmas = competition.slug === 'christmas' || competition.title.toLowerCase().includes('christmas');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-24">
      <Header />

      {/* Top Breadcrumb & Status */}
      <div className="border-b border-neutral-800 bg-[#0d0d0d] px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/competitions"
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Competitions</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 font-bold">
              {competition.status}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/50 text-blue-300 border border-blue-800/70">
              1 SUBMISSION PER MEMBER
            </span>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className={`border-b border-neutral-800 ${isChristmas ? 'bg-gradient-to-b from-red-950/20 via-neutral-950 to-[#0a0a0a]' : 'bg-neutral-950/40'} py-10 px-4 sm:px-6`}>
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>COMMUNITY MIX COMPETITION</span>
            </span>

            {isChristmas && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-950/40 text-red-300 border border-red-800/60 font-semibold">
                <span>HOLIDAY SPECIAL</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/40 text-amber-300 border border-amber-700/60">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>PLUS & PREMIUM 3-DAY EARLY ACCESS</span>
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {competition.title}
            </h1>
            {competition.description && (
              <p className="text-sm sm:text-base text-neutral-300 max-w-3xl leading-relaxed">
                {competition.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400 pt-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span>Deadline: <strong className="text-neutral-200">{competition.deadline || 'TBD (Announced in Discord)'}</strong></span>
            </span>

            {competition.sponsorOrPrize && (
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Prize: <strong className="text-neutral-200">{competition.sponsorOrPrize}</strong></span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">

        {/* Early Access Alert Banner */}
        {userState.isEarlyAccessActive && (
          <div className="p-4 rounded-xl border border-amber-600/40 bg-amber-950/20 text-xs sm:text-sm text-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">
                  Members 3-Day Early Access Window Active
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Plus and Premium members can download the competition multitrack stems now. Multitrack stems open for everyone 3 days later.
                </p>
              </div>
            </div>

            {!userState.hasEarlyAccess && (
              <Link
                href="/membership"
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-black transition-colors"
              >
                Upgrade for Instant Access
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Multitracks & Rules */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stems Download Card */}
            <div className="bg-[#121212] border border-neutral-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
                <Disc className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Multitrack Session Stems</h3>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Download the full, unmixed audio stems recorded live from the Sunday service. Import into your DAW to begin mixing.
              </p>

              {userState.canDownload ? (
                <a
                  href={`/api/competitions/${slug}/download`}
                  download
                  className="w-full py-2.5 px-4 rounded bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Stems (ZIP)</span>
                </a>
              ) : (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full py-2.5 px-4 rounded bg-neutral-800 text-neutral-500 font-medium text-xs cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-amber-400/80" />
                    <span>Locked (Early Access Active)</span>
                  </button>
                  <p className="text-[11px] text-amber-300/80 text-center">
                    Unlocks for everyone once the 3-day member window concludes.
                  </p>
                </div>
              )}
            </div>

            {/* Rules Card */}
            <div className="bg-[#121212] border border-neutral-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Competition Guidelines</h3>
              </div>

              <div className="text-xs text-neutral-300 space-y-2.5 whitespace-pre-line leading-relaxed">
                {competition.rules || (
                  <>
                    <p>1. Exactly one mix submission per Discord account.</p>
                    <p>2. Audio formats accepted: 24-bit WAV, MP3, or FLAC.</p>
                    <p>3. Keep your mix clean and balanced with headroom for mastering.</p>
                    <p>4. Include your DAW/console and signal chain notes.</p>
                    <p>5. Have fun and bring out the best in the performance!</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Submission Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Condition 1: User not logged in */}
            {!user ? (
              <div className="border border-neutral-800 bg-[#121212] rounded-xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 mx-auto flex items-center justify-center text-neutral-400">
                  <User className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white">Discord Account Required</h3>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto">
                    All competition submissions are verified through your Discord account to guarantee fair play and enforce the 1-submission limit per member.
                  </p>
                </div>
                <div>
                  <a
                    href={`/api/auth/discord?returnTo=/competitions/${slug}`}
                    className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold px-5 py-2.5 rounded transition-colors shadow-xs"
                  >
                    <User className="w-4 h-4" />
                    <span>Log In with Discord to Submit Mix</span>
                  </a>
                </div>
              </div>
            ) : userState.hasSubmitted || submitSuccess ? (
              /* Condition 2: Already submitted mix */
              <div className="border border-emerald-800/80 bg-emerald-950/20 rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-900/60 border border-emerald-700/80 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      Submission Locked In
                    </span>
                    <h2 className="text-xl font-bold text-white">
                      Your Mix Has Been Submitted!
                    </h2>
                    <p className="text-xs text-neutral-300">
                      You have entered the {competition.title}. Each Discord account is limited to exactly 1 submission.
                    </p>
                  </div>
                </div>

                {/* Submitted Audio Player */}
                {userState.submission && (
                  <div className="bg-[#121212] border border-neutral-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                      <span className="flex items-center gap-1.5 text-neutral-200">
                        <FileAudio className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{userState.submission.audioFilename}</span>
                      </span>
                      <span>{formatSize(userState.submission.audioFilesize)}</span>
                    </div>

                    <AudioPlayer
                      src={userState.submission.audioUrl}
                      title={userState.submission.audioFilename}
                    />

                    {userState.submission.dawOrConsole && (
                      <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-800 flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-neutral-500" />
                        <span>DAW / Console: <strong className="text-neutral-200">{userState.submission.dawOrConsole}</strong></span>
                      </div>
                    )}

                    {userState.submission.mixNotes && (
                      <div className="text-xs text-neutral-300 bg-neutral-900/60 p-3 rounded border border-neutral-800 whitespace-pre-line">
                        {userState.submission.mixNotes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Condition 3: Ready to submit */
              <form onSubmit={handleSubmitMix} className="border border-neutral-800 bg-[#121212] rounded-xl p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Submit Your Competition Mix</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Submitting as <strong className="text-neutral-200">{userState.username || 'Member'}</strong>. Limit is 1 submission per Discord account.
                  </p>
                </div>

                {/* File Upload Dropzone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    selectedFile
                      ? 'border-emerald-600/70 bg-emerald-950/20'
                      : 'border-neutral-700 hover:border-neutral-600 bg-neutral-900/40 hover:bg-neutral-900/70'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".wav,.mp3,.flac,.aif,.aiff,.m4a"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="space-y-1">
                      <FileAudio className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
                      <p className="text-xs text-neutral-400 font-mono">{formatSize(selectedFile.size)}</p>
                      <p className="text-[11px] text-emerald-400/90 pt-1">Click or drag another file to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="w-8 h-8 text-neutral-500 mx-auto" />
                      <p className="text-xs sm:text-sm font-medium text-neutral-300">
                        Drop your stereo mix file here, or <span className="text-white underline">browse</span>
                      </p>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        Accepts WAV, MP3, FLAC (Max 150MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* DAW / Console Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300 block">
                    DAW or Console Used
                  </label>
                  <input
                    type="text"
                    value={dawOrConsole}
                    onChange={(e) => setDawOrConsole(e.target.value)}
                    placeholder="e.g. Pro Tools, Logic Pro, Ableton, Studio One, SSL 4000, etc."
                    className="w-full bg-[#161616] border border-neutral-800 rounded-lg px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                {/* Mix Notes Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300 block">
                    Mix Notes & Processing Details (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={mixNotes}
                    onChange={(e) => setMixNotes(e.target.value)}
                    placeholder="Share any special outboard gear, master bus processing, or vocal chains you used..."
                    className="w-full bg-[#161616] border border-neutral-800 rounded-lg p-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors leading-relaxed"
                  />
                </div>

                {/* Warning callout */}
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Reminder: Exactly 1 mix submission is permitted per Discord account. Once submitted, your entry will be locked in for competition review.
                  </span>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting || !selectedFile}
                  className="w-full py-3 px-4 rounded bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading Mix...</span>
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4" />
                      <span>Submit Mix (1 Final Submission)</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
