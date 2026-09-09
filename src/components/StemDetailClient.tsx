'use client';

import { useState } from 'react';
import {
  Star,
  MessageSquare,
  Music2,
  Heart,
  Send,
  PlusCircle,
  ExternalLink,
  Download,
  Flag,
  Check,
  Music,
  Calendar,
  User,
  HardDrive,
  Layers,
  FileAudio,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { Stem, Profile, StemComment, StemMix } from '@/types';
import { rateStem, addComment, submitCommunityMix, toggleMixLike, flagStem, deleteStem } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { clsx } from 'clsx';
import { AdminBar } from './AdminBar';

interface StemDetailClientProps {
  stem: Stem;
  artworkUrl: string | null;
  profile: Profile | null;
  initialComments: StemComment[];
  initialMixes: StemMix[];
  initialAvgRating: number;
  initialUserRating: number;
  initialRatingCount: number;
}

export function StemDetailClient({
  stem,
  artworkUrl,
  profile: serverProfile,
  initialComments,
  initialMixes,
  initialAvgRating,
  initialUserRating,
  initialRatingCount,
}: StemDetailClientProps) {
  const { addToast } = useToast();
  const { user: clientUser, profile: clientProfile, accessToken } = useAuth();
  const profile = clientProfile || serverProfile;
  const user = clientUser || (profile ? { id: profile.id, email: profile.email } : null);

  const userHandle = profile?.display_name
    ? `@${profile.display_name}`
    : profile?.email
    ? `@${profile.email.split('@')[0]}`
    : clientUser?.email
    ? `@${clientUser.email.split('@')[0]}`
    : 'Anonymous';

  // Ratings State
  const [avgRating, setAvgRating] = useState(initialAvgRating);
  const [userRating, setUserRating] = useState(initialUserRating);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Comments State
  const [comments, setComments] = useState<StemComment[]>(initialComments);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Mixes State
  const [mixes, setMixes] = useState<StemMix[]>(initialMixes);
  const [showMixForm, setShowMixForm] = useState(false);
  const [mixTitle, setMixTitle] = useState('');
  const [mixUrl, setMixUrl] = useState('');
  const [mixDesc, setMixDesc] = useState('');
  const [mixLoading, setMixLoading] = useState(false);

  // Status & Local state
  const [reporting, setReporting] = useState(false);
  const [localVerified, setLocalVerified] = useState(stem.is_verified);

  const isAdmin = profile?.role === 'admin';
  const formattedDate = new Date(stem.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Handle Star Rating
  const handleRate = async (star: number) => {
    if (!user) {
      addToast('Please sign in to rate this stem session.', 'info');
      return;
    }
    setRatingLoading(true);
    const res = await rateStem(stem.id, star, accessToken || undefined);
    if (res.success) {
      addToast('Thank you for rating!', 'success');
      // Recalculate average locally
      const oldUserRating = userRating;
      setUserRating(star);
      if (oldUserRating === 0) {
        const newCount = ratingCount + 1;
        setRatingCount(newCount);
        setAvgRating(parseFloat(((avgRating * ratingCount + star) / newCount).toFixed(1)));
      } else {
        setAvgRating(parseFloat(((avgRating * ratingCount - oldUserRating + star) / ratingCount).toFixed(1)));
      }
    } else {
      addToast(res.message, 'error');
    }
    setRatingLoading(false);
  };

  // Handle New Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('Please sign in to comment.', 'info');
      return;
    }
    if (!commentInput.trim()) return;

    setCommentLoading(true);
    const res = await addComment(stem.id, commentInput, accessToken || undefined);
    if (res.success) {
      addToast('Comment posted.', 'success');
      setComments(prev => [
        {
          id: String(Date.now()),
          stem_id: stem.id,
          user_id: user.id,
          user_handle: userHandle,
          content: commentInput.trim(),
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCommentInput('');
    } else {
      addToast(res.message, 'error');
    }
    setCommentLoading(false);
  };

  // Handle New Mix Submission
  const handleMixSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('Please sign in to share a mix.', 'info');
      return;
    }

    setMixLoading(true);
    const res = await submitCommunityMix(stem.id, mixTitle, mixUrl, mixDesc, accessToken || undefined);
    if (res.success) {
      addToast('Mix submitted to the showcase!', 'success');
      setMixes(prev => [
        {
          id: String(Date.now()),
          stem_id: stem.id,
          user_id: user.id,
          user_handle: userHandle,
          title: mixTitle.trim(),
          mix_url: mixUrl.trim(),
          description: mixDesc.trim() || null,
          likes_count: 0,
          user_has_liked: false,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setMixTitle('');
      setMixUrl('');
      setMixDesc('');
      setShowMixForm(false);
    } else {
      addToast(res.message, 'error');
    }
    setMixLoading(false);
  };

  // Handle Like Mix
  const handleLikeMix = async (mixId: string) => {
    if (!user) {
      addToast('Please sign in to like a mix.', 'info');
      return;
    }

    setMixes(prev => prev.map(m => {
      if (m.id === mixId) {
        const liked = !m.user_has_liked;
        return {
          ...m,
          user_has_liked: liked,
          likes_count: liked ? m.likes_count + 1 : Math.max(0, m.likes_count - 1)
        };
      }
      return m;
    }));

    await toggleMixLike(mixId, stem.id, accessToken || undefined);
  };

  const handleReport = async () => {
    setReporting(true);
    const res = await flagStem(stem.id);
    addToast(
      res.success ? 'Link reported — thanks for keeping the archive clean.' : res.message,
      res.success ? 'info' : 'error'
    );
    setReporting(false);
  };

  return (
    <div className="min-h-screen bg-obsidian text-warm-white pb-20">
      <Header onStemAdded={() => {}} />

      {/* Top Bar */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-body text-dim hover:text-amber transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vault Archive
        </Link>
      </div>

      {/* Main Track Detail Header */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="bg-surface border border-border rounded-sm p-6 sm:p-10 space-y-8 shadow-xl">

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Album Cover */}
            <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-sm overflow-hidden bg-surface-raised border border-border shrink-0 shadow-lg relative group">
              {artworkUrl ? (
                <img
                  src={artworkUrl}
                  alt={`${stem.title} by ${stem.artist}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface-raised via-obsidian to-surface flex items-center justify-center">
                  <Music className="w-16 h-16 text-amber/40" />
                </div>
              )}
            </div>

            {/* Track Info & Actions */}
            <div className="flex-1 space-y-4 min-w-0">

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-body px-2.5 py-1 rounded-sm border border-border bg-surface-raised text-warm-white font-semibold">
                    {stem.host_platform}
                  </span>
                  {localVerified && (
                    <span className="text-xs font-body text-amber bg-obsidian border border-amber/40 px-2.5 py-1 rounded-sm font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> PRO SESSION
                    </span>
                  )}
                </div>

                {/* Rating Display Header */}
                <div className="flex items-center gap-2 bg-obsidian border border-border px-3 py-1.5 rounded-sm">
                  <div className="flex items-center text-amber">
                    <Star className="w-4 h-4 fill-amber text-amber" />
                    <span className="ml-1 text-sm font-bold">{avgRating > 0 ? avgRating : 'New'}</span>
                  </div>
                  <span className="text-xs text-dim">({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})</span>
                </div>
              </div>

              <div>
                <h1 className="font-display text-3xl sm:text-4xl text-warm-white leading-tight">
                  {stem.title}
                </h1>
                <p className="text-amber text-lg sm:text-xl font-body font-semibold mt-1">{stem.artist}</p>
              </div>

              {/* Submitter & Date info */}
              <div className="flex flex-wrap gap-2 text-xs font-body text-dim pt-1">
                <div className="flex items-center gap-1.5 bg-obsidian border border-border px-3 py-1.5 rounded-sm">
                  <User className="w-3.5 h-3.5 text-amber" />
                  <span>Submitted by <strong className="text-warm-white font-medium">{stem.uploader_handle}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 bg-obsidian border border-border px-3 py-1.5 rounded-sm">
                  <Calendar className="w-3.5 h-3.5 text-amber" />
                  <span>Added {formattedDate}</span>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <a
                  href={stem.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-sm px-6 py-3 rounded-sm transition-colors uppercase tracking-wider shadow-lg hover:shadow-amber/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Stems ({stem.host_platform})</span>
                  <ExternalLink className="w-4 h-4 opacity-75 ml-1" />
                </a>

                <button
                  onClick={handleReport}
                  disabled={reporting}
                  className="flex items-center gap-1.5 text-xs text-dim hover:text-error border border-border hover:border-error/50 px-4 py-3 rounded-sm transition-colors disabled:opacity-40"
                >
                  <Flag className="w-4 h-4" />
                  <span>Report Dead Link</span>
                </button>
              </div>

            </div>
          </div>

          {/* Technical Specs Grid */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-amber font-semibold">
              Session Technical Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SpecBox icon={<Music className="w-4 h-4 text-amber" />} label="Tempo" value={stem.bpm ? `${stem.bpm} BPM` : 'Unspecified'} />
              <SpecBox icon={<FileAudio className="w-4 h-4 text-amber" />} label="Musical Key" value={stem.key || 'Unspecified'} />
              <SpecBox icon={<Layers className="w-4 h-4 text-amber" />} label="Stem Count" value={stem.track_count ? `${stem.track_count} Tracks` : 'Unspecified'} />
              <SpecBox icon={<HardDrive className="w-4 h-4 text-amber" />} label="Format / Quality" value={stem.format} />
            </div>
          </div>

          {/* Special Notes */}
          {stem.description && (
            <div className="space-y-2 bg-surface-raised border border-border p-5 rounded-sm">
              <h3 className="text-xs font-mono uppercase tracking-wider text-amber font-semibold">
                Special Notes & Session Details
              </h3>
              <p className="text-sm font-body text-warm-white leading-relaxed whitespace-pre-wrap">
                {stem.description}
              </p>
            </div>
          )}

          {/* Rate This Stem Section */}
          <div className="bg-obsidian border border-border p-5 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-body font-bold text-warm-white">Rate Sound Quality & Session Quality</h3>
              <p className="text-xs text-dim font-body mt-0.5">Help the community identify high-quality multitrack sessions.</p>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  disabled={ratingLoading}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none disabled:opacity-50"
                  title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={clsx(
                      'w-6 h-6 transition-colors',
                      (hoverRating || userRating) >= star
                        ? 'fill-amber text-amber'
                        : 'text-dim hover:text-amber/50'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Dual Grid: Community Mix Showcase & Discussions */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Community Mixes Showcase */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Music2 className="w-5 h-5 text-amber" />
              <h2 className="font-display text-xl text-warm-white">Community Mixes</h2>
              <span className="text-xs bg-surface-raised border border-border text-dim px-2 py-0.5 rounded-full font-mono">
                {mixes.length}
              </span>
            </div>

            <button
              onClick={() => setShowMixForm(s => !s)}
              className="flex items-center gap-1.5 text-xs font-body font-semibold bg-amber hover:bg-amber-muted text-obsidian px-3 py-1.5 rounded-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Share Your Mix</span>
            </button>
          </div>

          {/* Mix Submission Form */}
          {showMixForm && (
            <form onSubmit={handleMixSubmit} className="bg-surface border border-amber/40 p-4 rounded-sm space-y-3 animate-[fade-in_0.2s_ease-out]">
              <h3 className="text-xs font-mono uppercase text-amber font-semibold">Post Your Audio Mix / Master</h3>

              <input
                type="text"
                required
                value={mixTitle}
                onChange={e => setMixTitle(e.target.value)}
                placeholder="Mix Title (e.g. My FOH Live Mix, Mastered Version)"
                className="w-full bg-obsidian border border-border rounded px-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber placeholder:text-dim/50"
              />

              <input
                type="url"
                required
                value={mixUrl}
                onChange={e => setMixUrl(e.target.value)}
                placeholder="Audio / Video Link (SoundCloud, YouTube, Drive, MP3 URL)"
                className="w-full bg-obsidian border border-border rounded px-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber placeholder:text-dim/50"
              />

              <textarea
                value={mixDesc}
                onChange={e => setMixDesc(e.target.value)}
                rows={2}
                placeholder="Optional notes on plugins, DAW, or workflow..."
                className="w-full bg-obsidian border border-border rounded px-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber placeholder:text-dim/50 resize-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMixForm(false)}
                  className="px-3 py-1.5 text-xs text-dim hover:text-warm-white font-body"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mixLoading}
                  className="bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian font-body font-bold text-xs px-4 py-1.5 rounded-sm transition-colors"
                >
                  {mixLoading ? 'Submitting…' : 'Submit Mix'}
                </button>
              </div>
            </form>
          )}

          {/* Mixes List */}
          {mixes.length === 0 ? (
            <div className="bg-surface border border-border p-8 text-center rounded-sm space-y-2">
              <p className="text-sm font-body text-dim">No community mixes posted yet.</p>
              <p className="text-xs font-body text-dim/70">Be the first engineer to share your mix from these stems!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mixes.map(mix => (
                <div key={mix.id} className="bg-surface border border-border p-4 rounded-sm space-y-2.5 hover:border-amber/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-body font-bold text-warm-white text-base leading-snug">{mix.title}</h4>
                      <p className="text-xs text-amber font-body">by {mix.user_handle}</p>
                    </div>

                    <button
                      onClick={() => handleLikeMix(mix.id)}
                      className={clsx(
                        'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-sm border transition-colors shrink-0',
                        mix.user_has_liked
                          ? 'bg-amber/10 border-amber/40 text-amber font-bold'
                          : 'bg-obsidian border-border text-dim hover:text-warm-white'
                      )}
                    >
                      <Heart className={clsx('w-3.5 h-3.5', mix.user_has_liked && 'fill-amber text-amber')} />
                      <span>{mix.likes_count}</span>
                    </button>
                  </div>

                  {mix.description && (
                    <p className="text-xs font-body text-mid leading-relaxed">{mix.description}</p>
                  )}

                  <div className="pt-1 flex items-center justify-between">
                    <a
                      href={mix.mix_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-body text-amber hover:underline font-medium"
                    >
                      <span>Listen to Mix</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Discussions & Comments */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber" />
              <h2 className="font-display text-xl text-warm-white">Member Comments</h2>
              <span className="text-xs bg-surface-raised border border-border text-dim px-2 py-0.5 rounded-full font-mono">
                {comments.length}
              </span>
            </div>
          </div>

          {/* New Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder={user ? "Add a comment or production feedback..." : "Sign in to leave a comment"}
              disabled={!user || commentLoading}
              className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber placeholder:text-dim/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!user || commentLoading || !commentInput.trim()}
              className="bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian p-2 rounded transition-colors shrink-0"
              title="Post Comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Comment Stream */}
          {comments.length === 0 ? (
            <div className="bg-surface border border-border p-8 text-center rounded-sm space-y-1">
              <p className="text-sm font-body text-dim">No comments yet.</p>
              <p className="text-xs font-body text-dim/70">Start the conversation about this session.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {comments.map(c => (
                <div key={c.id} className="bg-surface border border-border p-3.5 rounded-sm space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-body font-semibold text-amber">{c.user_handle}</span>
                    <span className="text-[10px] text-dim font-mono">{getTimeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm font-body text-warm-white leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

    </div>
  );
}

function SpecBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-obsidian border border-border p-3 rounded-sm space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-dim font-body">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-body font-semibold text-sm text-warm-white truncate">{value}</p>
    </div>
  );
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30)  return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
