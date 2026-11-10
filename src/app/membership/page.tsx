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

const LAUNCHPASS_URL = 'https://www.launchpass.com/all-access-by-tyler/membership';

const PLUS_PERKS = [
  'Full Access to The Mixing Vault (multitracks, stems, mixes)',
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

  // Derive active tier using canonical tier resolver
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
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono uppercase tracking-wider text-emerald-400">
          <span>Tiered Memberships</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Tyler Kerpsack All Access
        </h1>
        <p className="text-neutral-400 text-sm max-w-xl mx-auto leading-relaxed">
          Unlock multitracks, video lessons, plugin chains, and direct feedback from pros on The Mixing Vault.
        </p>
      </div>

      {/* Account Status Strip (If Logged In) */}
      {user && (
        <div className="bg-[#121212] border border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-11 h-11 rounded-full border border-neutral-700 object-cover shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{displayName}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    userTier === 'PREMIUM'
                      ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                      : userTier === 'PLUS'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
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
            {userTier !== 'FREE' ? (
              <a
                href={returnTo.startsWith('/membership') ? '/' : returnTo}
                className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Enter Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                onClick={handleRefreshRoles}
                disabled={refreshing}
                className="flex-1 sm:flex-none bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs py-2 px-3.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Checking...' : 'Refresh Roles'}</span>
              </button>
            )}

            <button
              onClick={() => signOut()}
              className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors rounded-lg hover:bg-neutral-800"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {refreshMessage && (
        <p className="text-xs text-amber-300 text-center px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg max-w-lg mx-auto">
          {refreshMessage}
        </p>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Plus Tier Card */}
        <div
          className={`relative bg-[#121212] border rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all shadow-xl ${
            userTier === 'PLUS' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Plus Tier</span>
              </div>
              {userTier === 'PLUS' && (
                <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
                  Your Current Plan
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">Plus Member</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Designed for those ready to actively level up their live mixing skills.
            </p>

            <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-neutral-800">
              <span className="text-4xl font-extrabold text-white">$15</span>
              <span className="text-xs text-neutral-400 font-medium">/ month</span>
            </div>

            {/* Perks List */}
            <ul className="space-y-3 mb-8">
              {PLUS_PERKS.map((perk, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300 leading-relaxed">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <a
              href={LAUNCHPASS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full font-semibold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                userTier === 'PLUS'
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black'
              }`}
            >
              <span>{userTier === 'PLUS' ? 'Manage Plus Subscription' : 'Join Plus Tier ($15/mo)'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Premium Tier Card */}
        <div
          className={`relative bg-[#121212] border rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all shadow-2xl ${
            userTier === 'PREMIUM'
              ? 'border-amber-500 ring-1 ring-amber-500'
              : 'border-neutral-700/80 hover:border-amber-500/60'
          }`}
        >
          {/* Top highlight ribbon */}
          <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full shadow-md">
            Ultimate All-Access
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/80">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Premium Tier</span>
              </div>
              {userTier === 'PREMIUM' && (
                <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">
                  Your Current Plan
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">Premium Member</h3>
            <p className="text-xs text-neutral-400 mb-6">
              The ultimate pass for hands-on professional feedback, direct reviews, and pro multitracks.
            </p>

            <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-neutral-800">
              <span className="text-4xl font-extrabold text-white">$30</span>
              <span className="text-xs text-neutral-400 font-medium">/ month</span>
            </div>

            {/* Perks List */}
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
              href={LAUNCHPASS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>{userTier === 'PREMIUM' ? 'Manage Premium Subscription' : 'Join Premium Tier ($30/mo)'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Discord Connect Callout if Not Logged In */}
      {!user && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 text-center space-y-3">
          <h3 className="text-base font-semibold text-white">Already a member?</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Log in with your Discord account to verify your active role and immediately access your unlocked vault.
          </p>
          <button
            onClick={handleDiscordSignIn}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-xs py-2.5 px-6 rounded-lg transition-colors inline-flex items-center gap-2 shadow-md cursor-pointer"
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
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex flex-col justify-between selection:bg-neutral-800 selection:text-white font-sans">
      <header className="border-b border-neutral-800/80 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
              MV
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-white">THE MIXING VAULT</span>
              <span className="text-[11px] text-neutral-500 font-normal">/ Beta</span>
            </div>
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        <Suspense fallback={<div className="text-center py-20 text-xs text-neutral-500">Loading...</div>}>
          <MembershipContent />
        </Suspense>
      </main>

      <footer className="border-t border-neutral-800/60 py-6 text-center text-xs text-neutral-500">
        <p>&copy; {new Date().getFullYear()} The Mixing Vault. Powered by KerpBot.</p>
      </footer>
    </div>
  );
}
