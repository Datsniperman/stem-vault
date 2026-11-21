'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getMembershipTier } from '@/lib/auth/tiers';
import {
  ExternalLink,
  Check,
  RefreshCw,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { FluidOrb } from '@/components/ui/fluid-orb';

const LAUNCHPASS_PLUS_URL = 'https://www.launchpass.com/all-access-by-tyler/plus';
const LAUNCHPASS_PREMIUM_URL = 'https://www.launchpass.com/all-access-by-tyler/membership';

const PLUS_PERKS = [
  'Full Access to The Mixing Vault (multitracks, stems, mixes)',
  '3-Day Early Access to Mix Competitions (including Christmas Special)',
  'Stream library of walkthroughs and archived video sessions',
  'Monthly Featured Track Competitions with live review chances',
  'Free Premium Plugin Chain Presets for major DAWs',
  'Exclusive audio mixing lessons made by Tyler',
  'Discord channels dedicated to your console brand',
  '25% discount on the official Shopify store',
];

const PREMIUM_PERKS = [
  'Everything included in the Plus Tier',
  'Pro Multitracks: high-quality sessions from pros & well-known churches',
  'Sunday Mix Reviews: direct, personalized feedback from Jared & pros',
  'Exclusive access to Live Monthly Streaming Sessions',
  'Priority access to emergency troubleshooting channel',
  'Connections & Opportunities: job postings, conference meetups, networking',
  '100% discount on the official Shopify store',
];

function MembershipContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || searchParams.get('next') || '/';

  const { user, profile, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const displayName =
    profile?.server_display_name ||
    profile?.display_name ||
    user?.user_metadata?.server_display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Member';

  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    null;

  const userTier = getMembershipTier(user);
  const isPremium = userTier === 'PREMIUM';
  const isPlus = userTier === 'PLUS';

  const handleRefreshRoles = async () => {
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      const res = await fetch('/api/auth/refresh-membership', { method: 'POST' });
      const data = await res.json();
      if (data.hasMembership) {
        if (data.session) {
          try {
            localStorage.setItem('mixingvault_session', JSON.stringify(data.session));
          } catch {}
        }
        const destination = returnTo.startsWith('/membership') ? '/' : returnTo;
        window.location.href = destination;
        return;
      }
      setRefreshMessage(
        data.message || 'Membership role not detected in Discord. Please ensure checkout is completed.'
      );
    } catch {
      const destination = returnTo.startsWith('/membership') ? '/' : returnTo;
      window.location.href = `/api/auth/discord?redirectTo=${encodeURIComponent(destination)}`;
    } finally {
      setRefreshing(false);
    }
  };

  const handleDiscordSignIn = () => {
    const destination = returnTo.startsWith('/membership') ? '/' : returnTo;
    window.location.href = `/api/auth/discord?redirectTo=${encodeURIComponent(destination)}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 py-6">
      {/* Title & Explainer */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#121215]/80 backdrop-blur-xl p-8 sm:p-12 text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] space-y-4">
        <div className="absolute -left-16 -top-16 opacity-25 blur-2xl pointer-events-none">
          <FluidOrb size={320} color="#2b2d35" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono uppercase tracking-wider text-neutral-300">
            <span>MEMBERSHIP TIERS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Tyler Kerpsack All Access
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Unlock multitracks, video lessons, plugin chains, and direct feedback from pros on The Mixing Vault.
          </p>
        </div>
      </div>

      {/* Account Status Strip (If Logged In) */}
      {user && (
        <div className="rare-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-11 h-11 rounded-full border border-white/[0.1] object-cover shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-neutral-800 border border-white/[0.1] flex items-center justify-center text-sm font-bold text-white shrink-0">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{displayName}</span>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    userTier === 'PREMIUM'
                      ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                      : userTier === 'PLUS'
                      ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'
                      : 'bg-white/[0.05] text-neutral-400 border-white/[0.08]'
                  }`}
                >
                  {userTier === 'PREMIUM' ? 'Premium Member' : userTier === 'PLUS' ? 'Plus Member' : 'Free Tier'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {userTier === 'FREE'
                  ? 'Link your paid membership tier below to unlock access.'
                  : 'Membership active. You have full access to The Mixing Vault.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleRefreshRoles}
              disabled={refreshing}
              className="flex-1 sm:flex-none bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] disabled:opacity-50 text-white text-xs py-2 px-4 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer backdrop-blur-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Roles'}</span>
            </button>

            {userTier !== 'FREE' && (
              <a
                href={returnTo.startsWith('/membership') ? '/' : returnTo}
                className="flex-1 sm:flex-none bg-white hover:bg-neutral-200 text-black font-semibold text-xs py-2 px-4 rounded-full transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>Enter Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={() => signOut()}
              className="p-2 text-neutral-500 hover:text-white transition-colors rounded-full hover:bg-white/[0.06]"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {refreshMessage && (
        <p className="text-xs text-amber-300 text-center px-4 py-2 bg-neutral-900 border border-white/[0.08] rounded-full max-w-lg mx-auto">
          {refreshMessage}
        </p>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Plus Tier Card */}
        <div
          className={`rare-card p-7 sm:p-8 flex flex-col justify-between ${
            userTier === 'PLUS' ? 'border-white/40 ring-1 ring-white/30' : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.05] text-neutral-200 border border-white/[0.08]">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                <span>Plus Tier</span>
              </div>
              {userTier === 'PLUS' && (
                <span className="text-[11px] text-white font-semibold uppercase tracking-wider font-mono">
                  Your Current Plan
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">Plus Member</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Designed for those ready to actively level up their live mixing skills.
            </p>

            <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-white/[0.08]">
              <span className="text-4xl font-extrabold text-white">$15</span>
              <span className="text-xs text-neutral-400 font-medium">/ month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {PLUS_PERKS.map((perk, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300 leading-relaxed">
                  <Check className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <a
              href={LAUNCHPASS_PLUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full font-semibold text-xs py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                userTier === 'PLUS'
                  ? 'bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.1]'
                  : 'bg-white hover:bg-neutral-200 text-black'
              }`}
            >
              <span>{userTier === 'PLUS' ? 'Manage Plus Subscription' : 'Join Plus Tier ($15/mo)'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Premium Tier Card */}
        <div
          className={`relative rare-card p-7 sm:p-8 flex flex-col justify-between ${
            userTier === 'PREMIUM' ? 'border-amber-400/60 ring-1 ring-amber-400/40' : ''
          }`}
        >
          <div className="absolute -top-3 right-6 bg-white text-black font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full shadow-md">
            Ultimate All-Access
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Premium Tier</span>
              </div>
              {userTier === 'PREMIUM' && (
                <span className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider font-mono">
                  Your Current Plan
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">Premium Member</h3>
            <p className="text-xs text-neutral-400 mb-6">
              The ultimate pass for hands-on professional feedback, direct reviews, and pro multitracks.
            </p>

            <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-white/[0.08]">
              <span className="text-4xl font-extrabold text-white">$30</span>
              <span className="text-xs text-neutral-400 font-medium">/ month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {PREMIUM_PERKS.map((perk, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300 leading-relaxed">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <a
              href={LAUNCHPASS_PREMIUM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.01]"
            >
              <span>{userTier === 'PREMIUM' ? 'Manage Premium Subscription' : 'Join Premium Tier ($30/mo)'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {!user && (
        <div className="rounded-[28px] border border-white/[0.08] p-8 text-center space-y-3 bg-[#141416]/60 backdrop-blur-xl">
          <h3 className="text-base font-semibold text-white">Already a member?</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Log in with your Discord account to verify your active role and immediately access your unlocked vault.
          </p>
          <button
            onClick={handleDiscordSignIn}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-xs py-2.5 px-6 rounded-full transition-all inline-flex items-center gap-2 shadow-md cursor-pointer"
          >
            <span>Log In with Discord</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function MembershipPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0e] text-neutral-200 flex flex-col justify-between selection:bg-neutral-800 selection:text-white font-sans">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        <Suspense fallback={<div className="text-center py-20 text-xs text-neutral-500">Loading...</div>}>
          <MembershipContent />
        </Suspense>
      </main>

      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-neutral-500 font-mono">
        <p>&copy; {new Date().getFullYear()} The Mixing Vault. Powered by KerpBot.</p>
      </footer>
    </div>
  );
}
