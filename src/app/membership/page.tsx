'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  ExternalLink,
  ShieldCheck,
  Disc3,
  Sliders,
  Layers,
  Sparkles,
  RefreshCw,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

const LAUNCHPASS_URL = 'https://www.launchpass.com/all-access-by-tyler/membership';

function MembershipContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || searchParams.get('next') || '/';

  const { user, profile, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefreshRoles = () => {
    setRefreshing(true);
    const destination = returnTo.startsWith('/membership') ? '/' : returnTo;
    window.location.href = `/api/auth/discord?redirectTo=${encodeURIComponent(destination)}`;
  };

  const handleDiscordSignIn = () => {
    const destination = returnTo.startsWith('/membership') ? '/' : returnTo;
    window.location.href = `/api/auth/discord?redirectTo=${encodeURIComponent(destination)}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto text-center space-y-8">
      {/* Header Tag */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300">
        <Lock className="w-3 h-3 text-amber-400" />
        <span>MEMBER ONLY ARCHIVE & MIX CHALLENGES</span>
      </div>

      {/* Title & Explainer */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Tyler Kerpsack All Access
        </h1>
        <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">
          The Mixing Vault is private and exclusive to active members of the{' '}
          <strong className="text-white font-medium">Tyler Kerpsack All Access</strong> Discord server.
        </p>
      </div>

      {/* Interactive Card */}
      <div className="bg-[#121212] border border-neutral-800 rounded-xl p-6 sm:p-8 shadow-2xl text-left space-y-6">
        {user ? (
          /* User IS Logged In with Alt / Account Missing Role */
          <div className="space-y-5">
            <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full border border-neutral-700 object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-900/50">
                    Missing Role
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                  {user.email || 'Discord Connected'}
                </p>
              </div>
            </div>

            <div className="bg-amber-950/30 border border-amber-900/40 rounded-lg p-3.5 text-xs text-amber-200/90 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">
                  Membership Role Required
                </p>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Your Discord account is connected, but you do not have the required <strong className="text-neutral-200">All Access</strong> role in our server. You can activate your membership below.
                </p>
              </div>
            </div>

            {/* Primary CTA: LaunchPass */}
            <div className="space-y-2.5 pt-1">
              <a
                href={LAUNCHPASS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Activate Membership on LaunchPass</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Refresh Roles Button */}
              <button
                onClick={handleRefreshRoles}
                disabled={refreshing}
                className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-neutral-200 border border-neutral-700/80 font-medium text-xs py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing Roles...' : 'I Already Purchased — Re-check My Roles'}</span>
              </button>

              {/* Disconnect / Switch Account */}
              <button
                onClick={() => signOut()}
                className="w-full text-center text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors pt-1 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3 h-3" />
                <span>Switch Discord Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* User NOT Logged In - Act as Login / Signup Gateway */
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white">
                Sign In or Join All Access
              </h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                If you are already an All Access member, sign in with your Discord account to verify your role and enter.
              </p>
            </div>

            <div className="space-y-3">
              {/* Connect with Discord Button */}
              <button
                onClick={handleDiscordSignIn}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-xs py-3.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2.5 shadow-md cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Log In with Discord</span>
              </button>

              <div className="relative py-2 flex items-center justify-center">
                <div className="border-t border-neutral-800 w-full" />
                <span className="bg-[#121212] px-3 text-[10px] uppercase tracking-wider text-neutral-500 font-mono absolute">
                  New Member?
                </span>
              </div>

              {/* Purchase Link */}
              <a
                href={LAUNCHPASS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Get All Access on LaunchPass</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Micro Trust Badge */}
        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
          <span>Instant Discord role sync after checkout</span>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-4">
        <FeatureCard
          icon={<Disc3 className="w-4 h-4 text-white" />}
          title="Full Multitrack Archive"
          description="Direct high-speed downloads of complete raw production sessions, stem packages, and mixes."
        />
        <FeatureCard
          icon={<Layers className="w-4 h-4 text-white" />}
          title="Weekly Mix Challenges"
          description="Download featured stems each week, submit your mix, and get critiques from the community."
        />
        <FeatureCard
          icon={<Sliders className="w-4 h-4 text-white" />}
          title="DAW Chains & Presets"
          description="Access curated vocal, drum, and mix-bus plugin chains for Pro Tools, Logic, and Studio One."
        />
        <FeatureCard
          icon={<Sparkles className="w-4 h-4 text-white" />}
          title="VIP Discord Community"
          description="Direct community engagement, Q&A, and technical mix discussions with Tyler and peers."
        />
      </div>
    </div>
  );
}

export default function MembershipPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
      {/* Top Minimal Navigation Bar */}
      <header className="border-b border-neutral-800/80 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
              MV
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">
                THE MIXING VAULT
              </span>
              <span className="hidden sm:inline text-[11px] text-neutral-500 font-normal">
                All Access Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={LAUNCHPASS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded bg-white hover:bg-neutral-200 text-black transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Get Membership</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content wrapped in Suspense for useSearchParams */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        <Suspense
          fallback={
            <div className="w-full max-w-xl mx-auto text-center py-20 text-neutral-500 text-xs">
              Loading membership portal...
            </div>
          }
        >
          <MembershipContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 py-6 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} The Mixing Vault. Powered by KerpBot.</p>
        <p className="mt-1 text-[11px] text-neutral-600">
          Exclusive to Tyler Kerpsack All Access members.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-[#121212]/60 border border-neutral-800/80 space-y-1.5 hover:border-neutral-700 transition-colors">
      <div className="flex items-center gap-2 text-white text-xs font-semibold">
        <div className="p-1 rounded bg-neutral-900 border border-neutral-800">
          {icon}
        </div>
        <span>{title}</span>
      </div>
      <p className="text-[11px] text-neutral-400 leading-relaxed pl-7">
        {description}
      </p>
    </div>
  );
}
