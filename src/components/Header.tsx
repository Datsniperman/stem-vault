'use client';

import { useState } from 'react';
import { ChevronDown, LogOut, User, Shield, Music2, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { AuthModal } from './AuthModal';
import { SubmitStemModal } from './SubmitStemModal';
import { AdminModal } from './AdminModal';
import { SettingsModal } from './SettingsModal';
import { Stem } from '@/types';

interface HeaderProps {
  onStemAdded: (stem: Stem) => void;
}

const ROLE_LABELS = {
  admin:    { label: 'Admin',    color: 'text-error' },
  verified: { label: 'Super User / Pro', color: 'text-verified' },
  user:     { label: 'Member',   color: 'text-mid' },
};

export function Header({ onStemAdded }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { addToast } = useToast();
  const [authOpen, setAuthOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roleInfo = profile ? ROLE_LABELS[profile.role] : null;
  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  const handleAdminClick = () => {
    setAdminOpen(true);
  };

  const handleMySubmissionsClick = () => {
    if (user?.email) {
      addToast(`Showing stems submitted by ${user.email}.`, 'info');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-obsidian/96 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[56px] flex items-center justify-between gap-6">

          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-amber rounded-sm flex items-center justify-center">
              <Music2 className="w-4 h-4 text-obsidian" strokeWidth={2.5} />
            </div>
            <span className="font-body font-bold text-warm-white text-[15px] tracking-tight">
              Stem Vault
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setSubmitOpen(true)}
                  className="bg-amber hover:bg-amber-muted text-obsidian font-body font-semibold text-sm px-4 py-1.5 rounded-sm transition-colors"
                >
                  Submit to Vault
                </button>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(d => !d)}
                    onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                    className="flex items-center gap-2 hover:bg-surface-raised px-2.5 py-1.5 rounded-sm transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-surface-raised border border-border flex items-center justify-center font-mono text-[10px] text-warm-white font-bold">
                      {initials}
                    </div>
                    {roleInfo && (
                      <span className={`hidden sm:block text-xs font-body ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-dim" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-surface border border-border rounded-sm shadow-2xl z-50 overflow-hidden">
                      <div className="px-3 py-2.5 border-b border-border">
                        <p className="text-xs font-body text-warm-white truncate">{user.email}</p>
                        {roleInfo && (
                          <p className={`text-xs font-body mt-0.5 ${roleInfo.color}`}>{roleInfo.label}</p>
                        )}
                      </div>
                      {profile?.role === 'admin' && (
                        <DropdownItem
                          icon={<Shield className="w-3.5 h-3.5 text-error" />}
                          label="Admin Panel"
                          onClick={handleAdminClick}
                        />
                      )}
                      <DropdownItem
                        icon={<Settings className="w-3.5 h-3.5 text-amber" />}
                        label="Account Settings"
                        onClick={() => setSettingsOpen(true)}
                      />
                      <DropdownItem
                        icon={<User className="w-3.5 h-3.5" />}
                        label="My Submissions"
                        onClick={handleMySubmissionsClick}
                      />
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-surface-raised transition-colors font-body text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="font-body text-sm text-mid hover:text-warm-white transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="bg-amber hover:bg-amber-muted text-obsidian font-body font-semibold text-sm px-4 py-1.5 rounded-sm transition-colors"
                >
                  Submit to Vault
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <SubmitStemModal
        isOpen={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onStemAdded={onStemAdded}
      />
      <AdminModal isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-mid hover:text-warm-white hover:bg-surface-raised transition-colors font-body text-left"
    >
      {icon}
      {label}
    </button>
  );
}
