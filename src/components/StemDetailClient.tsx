'use client';

import { useState, useEffect } from 'react';
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
  ArrowLeft,
  Trash2,
  Tag,
  Edit3,
  MessageCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { Stem, Profile, StemComment, StemMix } from '@/types';
import { rateStem, addComment, submitMix, submitCommunityMix, toggleMixLike, flagStem, deleteStem, deleteComment, incrementDownloadCount, setTrackOfTheWeek } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { clsx } from 'clsx';
import { AdminBar } from './AdminBar';
import { EditStemModal } from './EditStemModal';
import { AuthModal } from './AuthModal';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface StemDetailClientProps {
  stem: Stem;
  profile: Profile | null;
  initialComments: StemComment[];
  initialMixes: StemMix[];
  initialAvgRating: number;
  initialUserRating: number;
  initialRatingCount: number;
}

export function StemDetailClient({
  stem,
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
  const [songName, setSongName] = useState(stem.title || '');
  const [musicalKey, setMusicalKey] = useState(stem.key || '');
  const [bpmInput, setBpmInput] = useState(stem.bpm ? String(stem.bpm) : '');
  const [mixUrl, setMixUrl] = useState('');
  const [mixNotes, setMixNotes] = useState('');
  const [mixLoading, setMixLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mixSuccessData, setMixSuccessData] = useState<{
    isOpen: boolean;
    mixTitle: string;
    discordThreadUrl?: string | null;
  } | null>(null);

  // Check URL query param ?action=submit to auto-open mix form
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'submit') {
        setShowMixForm(true);
        const el = document.getElementById('mixes-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  // Stem local state & Edit Modal
  const [stemData, setStemData] = useState<Stem>(stem);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Status & Local state
  const [reporting, setReporting] = useState(false);
  const [localVerified, setLocalVerified] = useState(stem.is_verified);

  const isAdmin = profile?.role === 'admin';
  const isOwner = user?.id && user.id === stemData.user_id;
  const canEdit = isOwner || isAdmin;

  const formattedDate = new Date(stemData.created_at).toLocaleDateString('en-US', {
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
      addToast('Please log in with Discord to submit a mix.', 'info');
      setAuthModalOpen(true);
      return;
    }

    const parsedBpm = parseFloat(bpmInput);
    if (!songName.trim()) {
      addToast('Song name is required.', 'error');
      return;
    }
    if (!musicalKey.trim()) {
      addToast('Musical key is required.', 'error');
      return;
    }
    if (isNaN(parsedBpm) || parsedBpm <= 0) {
      addToast('Please enter a valid BPM.', 'error');
      return;
    }
    if (!mixUrl.trim()) {
      addToast('Cloud mix URL is required.', 'error');
      return;
    }

    setMixLoading(true);
    try {
      const res = await submitMix({
        stemId: stem.id,
        songName: songName.trim(),
        key: musicalKey.trim(),
        bpm: parsedBpm,
        mixUrl: mixUrl.trim(),
        notes: mixNotes.trim() || undefined,
        accessToken: accessToken || undefined,
      });

      if (res.success) {
        addToast('Mix submitted to the showcase & Discord!', 'success');
        const submittedTitle = `${songName.trim()} (${musicalKey.trim()} @ ${parsedBpm} BPM)`;
        setMixes(prev => [
          {
            id: res.mixId || String(Date.now()),
            stem_id: stem.id,
            user_id: user.id,
            user_handle: profile?.server_display_name || userHandle,
            title: submittedTitle,
            song_name: songName.trim(),
            musical_key: musicalKey.trim(),
            bpm: parsedBpm,
            mix_url: mixUrl.trim(),
            description: mixNotes.trim() || null,
            likes_count: 0,
            user_has_liked: false,
            discord_post_id: res.discordPostId || null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);

        const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '';
        const threadUrl =
          res.discordThreadUrl ||
          (res.discordThreadId && guildId ? `https://discord.com/channels/${guildId}/${res.discordThreadId}` : null);

        setMixSuccessData({
          isOpen: true,
          mixTitle: submittedTitle,
          discordThreadUrl: threadUrl,
        });

        setMixUrl('');
        setMixNotes('');
        setShowMixForm(false);
      } else {
        addToast(res.message, 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Submission failed.', 'error');
    } finally {
      setMixLoading(false);
    }
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

  const handleDownload = () => {
    incrementDownloadCount(stem.id).catch(() => {});
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    const res = await deleteComment(commentId, stem.id);
    if (res.success) {
      addToast('Comment deleted.', 'success');
      setComments(prev => prev.filter(c => c.id !== commentId));
    } else {
      addToast(res.message, 'error');
    }
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
            {/* Track Placeholder Banner */}
            <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-sm overflow-hidden bg-gradient-to-br from-surface-raised via-obsidian to-surface border border-border shrink-0 shadow-lg relative flex items-center justify-center">
              <Music className="w-16 h-16 text-amber/40" />
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
                  <span>
                    Submitted by{' '}
                    <Link
                      href={`/user/${encodeURIComponent(stem.uploader_handle.replace(/^@/, ''))}`}
                      className="text-warm-white font-medium hover:text-amber hover:underline transition-colors"
                    >
                      {stem.uploader_handle}
                    </Link>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-obsidian border border-border px-3 py-1.5 rounded-sm">
                  <Calendar className="w-3.5 h-3.5 text-amber" />
                  <span>Added {formattedDate}</span>
                </div>
              </div>

              {/* Track of the Week Banner if spotlighted */}
              {stem.tags?.includes('track of the week') && (
                <div className="bg-gradient-to-r from-amber/20 via-surface-raised to-surface border border-amber/50 p-4 rounded-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-amber font-body text-xs font-bold uppercase tracking-wider">
                    <Star className="w-4 h-4 fill-amber" />
                    <span>Featured Track of the Week — Official Mix Challenge</span>
                  </div>
                  <a
                    href="#mixes-section"
                    className="text-xs text-warm-white hover:text-amber font-body underline font-semibold transition-colors"
                  >
                    View Community Mixes Below ↓
                  </a>
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <a
                  href={stemData.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-sm px-6 py-3 rounded-sm transition-colors uppercase tracking-wider shadow-lg hover:shadow-amber/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Stems ({stemData.host_platform})</span>
                  <ExternalLink className="w-4 h-4 opacity-75 ml-1" />
                </a>

                {stemData.discord_thread_id && (
                  <a
                    href={`https://discord.com/channels/${process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || ''}/${stemData.discord_thread_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-body font-bold text-sm px-5 py-3 rounded-sm transition-colors shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Discord Feedback Thread</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                )}

                {canEdit && (
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-body font-bold text-warm-white bg-surface-raised border border-border hover:border-amber hover:text-amber px-4 py-3 rounded-sm transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-amber" />
                    <span>Edit Session</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={async () => {
                      const res = await setTrackOfTheWeek(stemData.id);
                      if (res.success) {
                        addToast(res.message, 'success');
                      } else {
                        addToast(res.message, 'error');
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-body font-bold text-amber border border-amber/50 hover:bg-amber/10 px-4 py-3 rounded-sm transition-colors"
                  >
                    <Star className="w-4 h-4 fill-amber" />
                    <span>{stemData.tags?.includes('track of the week') ? 'Track of the Week Active' : 'Make Track of the Week'}</span>
                  </button>
                )}

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

          <EditStemModal
            isOpen={isEditOpen}
            stem={stemData}
            onClose={() => setIsEditOpen(false)}
            onStemUpdated={(updated) => setStemData(updated)}
          />

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

          {/* Tags */}
          {(stem.tags || []).length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-mono text-dim uppercase tracking-wider">Tags:</span>
              {(stem.tags || []).map(tag => (
                <span key={tag} className="text-xs font-body text-mid bg-surface-raised border border-border px-2.5 py-1 rounded-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}

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
        <section id="mixes-section" className="space-y-4">
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
            <div className="bg-surface border border-amber/40 p-5 rounded-sm space-y-4 animate-[fade-in_0.2s_ease-out]">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="text-xs font-mono uppercase text-amber font-semibold tracking-wider flex items-center gap-2">
                  <Music2 className="w-4 h-4" />
                  Post Your Mix for Community & Discord Feedback
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMixForm(false)}
                  className="text-dim hover:text-warm-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!user ? (
                <div className="p-4 bg-obsidian border border-border rounded-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 flex items-center justify-center shrink-0 text-[#5865F2]">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-body text-warm-white font-medium">Discord Login Required</p>
                      <p className="text-xs font-body text-dim mt-0.5">
                        You must be logged in with your Discord account to submit a mix. Your mix details and cloud links will be linked to your server profile and forwarded directly to the Discord mix feedback thread.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const supabase = getSupabaseBrowserClient();
                      if (supabase) {
                        supabase.auth.signInWithOAuth({
                          provider: 'discord',
                          options: {
                            scopes: 'identify guilds guilds.members.read',
                            redirectTo: window.location.href,
                          },
                        });
                      } else {
                        setAuthModalOpen(true);
                      }
                    }}
                    className="flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold px-4 py-2 rounded-sm transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    Log in via Discord
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMixSubmit} className="space-y-4">
                  {/* Discord Member Identity Banner */}
                  <div className="bg-[#5865F2]/10 border border-[#5865F2]/30 px-3 py-2 rounded-sm flex items-center justify-between text-xs font-body">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-warm-white font-medium">
                        Submitting as: <strong className="text-amber">{profile?.server_display_name || profile?.display_name || userHandle}</strong> (from Discord Server)
                      </span>
                    </div>
                    <span className="text-[10px] text-dim font-mono uppercase tracking-wider">Discord Verified</span>
                  </div>

                  {/* Song Name */}
                  <div className="space-y-1">
                    <label className="block text-xs text-dim font-body">Song Name *</label>
                    <input
                      type="text"
                      required
                      value={songName}
                      onChange={e => setSongName(e.target.value)}
                      placeholder="e.g. Goodness of God (Live Mix)"
                      className="w-full bg-obsidian border border-border rounded px-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber placeholder:text-dim/50"
                    />
                  </div>

                  {/* Musical Key & BPM */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs text-dim font-body">Musical Key *</label>
                      <input
                        type="text"
                        required
                        value={musicalKey}
                        onChange={e => setMusicalKey(e.target.value)}
                        placeholder="e.g. C Major, F#m, Ab"
                        className="w-full bg-obsidian border border-border rounded px-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber placeholder:text-dim/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs text-dim font-body">BPM (Tempo) *</label>
                      <input
                        type="number"
                        required
                        min={30}
                        max={300}
                        value={bpmInput}
                        onChange={e => setBpmInput(e.target.value)}
                        placeholder="e.g. 72"
                        className="w-full bg-obsidian border border-border rounded px-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber placeholder:text-dim/50"
                      />
                    </div>
                  </div>

                  {/* Cloud Mix URL */}
                  <div className="space-y-1">
                    <label className="block text-xs text-dim font-body">Cloud Mix URL (Google Drive, Dropbox, Box, OneDrive) *</label>
                    <input
                      type="url"
                      required
                      value={mixUrl}
                      onChange={e => setMixUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or https://dropbox.com/..."
                      className="w-full bg-obsidian border border-border rounded px-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber placeholder:text-dim/50"
                    />
                  </div>

                  {/* Mix Notes / Console / DAW */}
                  <div className="space-y-1">
                    <label className="block text-xs text-dim font-body">Mix Notes / Console / DAW (Optional)</label>
                    <textarea
                      value={mixNotes}
                      onChange={e => setMixNotes(e.target.value)}
                      rows={2}
                      placeholder="Signal chain, console/DAW used, master bus processing, or questions for other mixers..."
                      className="w-full bg-obsidian border border-border rounded px-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber placeholder:text-dim/50 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-border/50">
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
                      className="bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian font-body font-bold text-xs px-4 py-2 rounded-sm transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {mixLoading ? (
                        <span>Submitting to Discord…</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Mix & Post to Discord</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
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
              {comments.map(c => {
                const canDelete = isAdmin || (profile && profile.id === c.user_id);
                return (
                  <div key={c.id} className="bg-surface border border-border p-3.5 rounded-sm space-y-1 group">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/user/${encodeURIComponent(c.user_handle.replace(/^@/, ''))}`}
                          className="font-body font-semibold text-amber hover:underline transition-colors"
                        >
                          {c.user_handle}
                        </Link>
                        <span className="text-[10px] text-dim font-mono">{getTimeAgo(c.created_at)}</span>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          title="Delete comment"
                          className="opacity-0 group-hover:opacity-100 p-1 text-dim hover:text-error hover:bg-error/10 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm font-body text-warm-white leading-relaxed">{c.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* Mix Submission Success Modal */}
      {mixSuccessData?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]">
          <div className="bg-surface border border-emerald-500/40 rounded-sm w-full max-w-md shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-xl text-warm-white">Mix Submitted Successfully!</h3>
              <p className="text-dim text-xs font-body leading-relaxed">
                Your mix <strong className="text-amber">{mixSuccessData.mixTitle}</strong> has been posted to the showcase and forwarded to Discord for community feedback.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              {mixSuccessData.discordThreadUrl && (
                <a
                  href={mixSuccessData.discordThreadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold py-2.5 px-4 rounded-sm transition-colors shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Discord Feedback Thread
                </a>
              )}
              <button
                onClick={() => setMixSuccessData(null)}
                className="flex items-center justify-center gap-2 bg-surface-raised hover:bg-border text-dim hover:text-warm-white text-xs py-2.5 px-4 rounded-sm transition-colors border border-border font-body"
              >
                View on Stem Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for 1-click Discord Sign-in */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

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
