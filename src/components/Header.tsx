'use client';

import { isUserAdmin } from '@/lib/auth/admin';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ChevronDown,
  LogOut,
  User,
  Shield,
  Settings,
  Plus,
  Music2,
  Layers,
  Sliders,
  FileArchive,
  Video,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { AuthModal } from './AuthModal';
import { SubmitStemModal } from './SubmitStemModal';
import { UploadMultiModal } from './UploadMultiModal';
import { UploadMixModal } from './UploadMixModal';
import { CreatePluginChainModal } from './CreatePluginChainModal';
import { AdminModal } from './AdminModal';
import { SettingsModal } from './SettingsModal';
import { BugReportModal } from './BugReportModal';
import { UpdateLogsModal } from './UpdateLogsModal';
import { DisclaimerModal } from './DisclaimerModal';
import { GooeyNav } from '@/components/ui/gooey-nav';
import Link from 'next/link';
import { Stem } from '@/types';

interface HeaderProps {
  onStemAdded?: (stem: Stem) => void;
}

const NAV_ITEMS = [
  { label: 'Multis', href: '/', icon: <Layers className="w-3.5 h-3.5" /> },
  { label: 'Mixes', href: '/mixes', icon: <Music2 className="w-3.5 h-3.5" /> },
  { label: 'Plugin Chains', href: '/plugin-chains', icon: <Sliders className="w-3.5 h-3.5" /> },
  { label: 'Competitions', href: '/competitions', icon: <Trophy className="w-3.5 h-3.5" /> },
  { label: 'Sessions', href: '/sessions', icon: <Video className="w-3.5 h-3.5" /> },
  { label: 'DAW Converter', href: '/daw-converter', icon: <FileArchive className="w-3.5 h-3.5" /> },
  { label: 'Membership', href: '/membership', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
];

export function Header({ onStemAdded }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const authErr = params.get('auth_error');
      if (authErr) {
        const readableMsg =
          authErr === 'true'
            ? 'Discord sign-in was not completed. Please try again.'
            : `Discord sign-in: ${decodeURIComponent(authErr)}`;
        addToast(readableMsg, 'error');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [addToast]);

  const [authOpen, setAuthOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [uploadMultiOpen, setUploadMultiOpen] = useState(false);
  const [uploadMixOpen, setUploadMixOpen] = useState(false);
  const [createChainOpen, setCreateChainOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [updateLogsOpen, setUpdateLogsOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const userRoles: string[] = [
    ...(Array.isArray((user as any)?.roles) ? (user as any).roles : []),
    ...(Array.isArray(user?.user_metadata?.roles) ? user.user_metadata.roles : []),
    ...(Array.isArray(user?.user_metadata?.custom_claims?.roles) ? user.user_metadata.custom_claims.roles : []),
  ];

  const userDiscordId =
    (user as any)?.discord_id ||
    user?.user_metadata?.discord_id ||
    user?.user_metadata?.provider_id ||
    (user?.identities && user.identities[0]?.id) ||
    '';

  const isAdminUser =
    profile?.role === 'admin' ||
    user?.role === 'admin' ||
    userDiscordId === '725867136232456302' ||
    userDiscordId === '1377286620344221778' ||
    (user
      ? isUserAdmin({
          email: user.email,
          discordId: userDiscordId,
          username: user.user_metadata?.server_display_name || user.user_metadata?.display_name,
          role: user.role,
          userMetadata: user.user_metadata,
          roles: userRoles,
        })
      : false);

  const displayName =
    profile?.server_display_name ||
    profile?.display_name ||
    user?.user_metadata?.server_display_name ||
    user?.user_metadata?.display_name ||
    user?.user_metadata?.custom_claims?.server_display_name ||
    user?.user_metadata?.custom_claims?.global_name ||
    user?.email?.split('@')[0] ||
    'Member';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleAdminClick = () => {
    setAdminOpen(true);
  };

  const handleMySubmissionsClick = () => {
    setDropdownOpen(false);
    router.push('/profile');
  };

  return (
    <>
      <header className="sticky top-3 z-50 w-full px-3 sm:px-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 pointer-events-auto">

          {/* Left Brand Capsule */}
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#141416]/90 hover:bg-[#1a1a1d] border border-white/[0.08] backdrop-blur-xl shadow-lg transition-all group shrink-0"
          >
            <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold text-[10px] tracking-wider shadow-xs group-hover:scale-105 transition-transform">
              MV
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold tracking-tight text-white group-hover:text-neutral-200 transition-colors">
                THE MIXING VAULT
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-medium bg-neutral-800/80 text-neutral-400 border border-white/[0.06]">
                Beta
              </span>
            </div>
          </Link>

          {/* Center: Rare UI GooeyNav */}
          <div className="hidden lg:block">
            <div className="rounded-full bg-[#141416]/85 border border-white/[0.08] p-1 backdrop-blur-xl shadow-xl">
              <GooeyNav
                items={NAV_ITEMS}
                size="sm"
                activeColor="#ffffff"
                activeLabelColor="#000000"
              />
            </div>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <button
                  onClick={() => setUploadMultiOpen(true)}
                  className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  title="Upload a new ZIP multitrack song"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload Multi</span>
                </button>

                {/* User Menu Capsule */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(d => !d)}
                    className="flex items-center gap-2 bg-[#141416]/90 hover:bg-[#1a1a1d] border border-white/[0.08] px-3 py-1.5 rounded-full transition-all backdrop-blur-xl shadow-md text-left"
                  >
                    <div className="w-5 h-5 rounded-full bg-neutral-800 border border-white/[0.1] text-neutral-200 flex items-center justify-center font-bold text-[9px]">
                      {initials}
                    </div>
                    <span className="text-xs text-neutral-200 font-medium max-w-[100px] truncate hidden sm:inline">
                      {displayName}
                    </span>
                    {isAdminUser && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-white border border-white/20">
                        Admin
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-neutral-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-[#141416]/95 border border-white/[0.1] rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-xs animate-[fade-in_0.15s_ease-out]">
                        <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                          <p className="text-white font-medium truncate">{displayName}</p>
                          <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                        </div>

                        <DropdownItem
                          icon={<Layers className="w-3.5 h-3.5 text-neutral-400" />}
                          label="Multis Catalog"
                          onClick={() => {
                            setDropdownOpen(false);
                            router.push('/');
                          }}
                        />

                        <DropdownItem
                          icon={<Music2 className="w-3.5 h-3.5 text-neutral-400" />}
                          label="Upload a Mix"
                          onClick={() => {
                            setDropdownOpen(false);
                            setUploadMixOpen(true);
                          }}
                        />

                        <DropdownItem
                          icon={<Sliders className="w-3.5 h-3.5 text-neutral-400" />}
                          label="Plugin Chains"
                          onClick={() => {
                            setDropdownOpen(false);
                            router.push('/plugin-chains');
                          }}
                        />

                        <DropdownItem
                          icon={<User className="w-3.5 h-3.5 text-neutral-400" />}
                          label="My Uploads"
                          onClick={handleMySubmissionsClick}
                        />

                        <DropdownItem
                          icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                          label="Membership Tiers"
                          onClick={() => {
                            setDropdownOpen(false);
                            router.push('/membership');
                          }}
                        />

                        {isAdminUser && (
                          <DropdownItem
                            icon={<Shield className="w-3.5 h-3.5 text-neutral-200" />}
                            label="Admin Center"
                            onClick={() => {
                              setDropdownOpen(false);
                              handleAdminClick();
                            }}
                          />
                        )}

                        <DropdownItem
                          icon={<Settings className="w-3.5 h-3.5 text-neutral-400" />}
                          label="Settings & Profile"
                          onClick={() => {
                            setDropdownOpen(false);
                            setSettingsOpen(true);
                          }}
                        />

                        <div className="my-1 border-t border-white/[0.08]" />

                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            signOut();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="bg-[#141416]/90 hover:bg-[#1a1a1d] text-neutral-200 hover:text-white border border-white/[0.08] font-medium text-xs px-4 py-2 rounded-full transition-all flex items-center gap-2 shadow-md backdrop-blur-xl"
              >
                <svg className="w-3.5 h-3.5 fill-current shrink-0 text-neutral-400" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Connect</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Subnav Pill */}
        <div className="lg:hidden mt-2 flex items-center justify-center pointer-events-auto">
          <div className="rounded-full bg-[#141416]/90 border border-white/[0.08] p-1 backdrop-blur-xl shadow-lg max-w-full overflow-x-auto">
            <GooeyNav
              items={NAV_ITEMS}
              size="xs"
              activeColor="#ffffff"
              activeLabelColor="#000000"
            />
          </div>
        </div>
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <SubmitStemModal
        isOpen={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onStemAdded={onStemAdded || (() => {})}
      />
      <UploadMultiModal
        isOpen={uploadMultiOpen}
        onClose={() => setUploadMultiOpen(false)}
      />
      <UploadMixModal
        isOpen={uploadMixOpen}
        onClose={() => setUploadMixOpen(false)}
      />
      <CreatePluginChainModal
        isOpen={createChainOpen}
        onClose={() => setCreateChainOpen(false)}
      />
      <AdminModal isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <UpdateLogsModal isOpen={updateLogsOpen} onClose={() => setUpdateLogsOpen(false)} />
      <BugReportModal isOpen={bugReportOpen} onClose={() => setBugReportOpen(false)} />
      <DisclaimerModal isOpen={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
    </>
  );
}

function DropdownItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors text-left font-medium"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
