'use client';

import { useState, useEffect } from 'react';
import { X, User, Lock, Eye, EyeOff } from 'lucide-react';
import { updateUsername } from '@/app/actions/stems';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (profile?.display_name) {
      setUsername(profile.display_name);
    } else if (user?.email) {
      setUsername(user.email.split('@')[0]);
    }
  }, [profile, user]);

  if (!isOpen || !user) return null;

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setUsernameLoading(true);
    try {
      const res = await updateUsername(user.id, username);
      if (res.success) {
        // Also update Supabase auth metadata client-side
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          await supabase.auth.updateUser({
            data: { display_name: username.trim().replace(/^@/, '') },
          });
        }
        addToast(res.message, 'success');
        await refreshProfile();
      } else {
        addToast(res.message, 'error');
      }
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      addToast('Password must be at least 8 characters long.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      addToast('Passwords do not match.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Client unavailable');

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        addToast(error.message, 'error');
      } else {
        addToast('Password updated successfully!', 'success');
        setPassword('');
        setConfirmPassword('');
      }
    } catch {
      addToast('Failed to update password.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border rounded-sm w-full max-w-md max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-display text-xl text-warm-white">Account Settings</h2>
            <p className="text-xs text-dim font-body mt-0.5">Manage your profile & security</p>
          </div>
          <button onClick={onClose} className="text-dim hover:text-warm-white p-1.5 transition-colors rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">

          {/* Account Overview Badge */}
          <div className="bg-surface-raised border border-border rounded p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-dim font-body">Signed in email</p>
              <p className="text-sm font-body text-warm-white font-medium truncate mt-0.5">{user.email}</p>
            </div>
            <div className="shrink-0">
              <span className={`text-xs font-body font-semibold px-2.5 py-1 rounded border ${
                profile?.role === 'admin'
                  ? 'bg-error/10 text-error border-error/30'
                  : profile?.role === 'verified'
                  ? 'bg-verified-dim text-verified border-verified/30'
                  : 'bg-surface text-dim border-border'
              }`}>
                {profile?.role === 'admin' ? 'ADMIN' : profile?.role === 'verified' ? 'PRO TECH' : 'MEMBER'}
              </span>
            </div>
          </div>

          {/* Section 1: Change Username */}
          <form onSubmit={handleUpdateUsername} className="space-y-3 pt-1">
            <h3 className="text-sm font-body font-semibold text-warm-white flex items-center gap-2">
              <User className="w-4 h-4 text-amber" />
              Change Username / Display Handle
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs text-dim font-body">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dim font-mono text-sm">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="mixguy_foh"
                  className="w-full bg-obsidian border border-border rounded-sm pl-8 pr-3 py-2 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/40 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={usernameLoading}
                className="bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian font-body font-semibold text-xs px-4 py-2 rounded-sm transition-colors uppercase tracking-wider"
              >
                {usernameLoading ? 'Saving…' : 'Save Username'}
              </button>
            </div>
          </form>

          <hr className="border-border" />

          {/* Section 2: Change Password */}
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <h3 className="text-sm font-body font-semibold text-warm-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber" />
              Change Password
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs text-dim font-body">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-obsidian border border-border rounded-sm pl-9 pr-10 py-2 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-warm-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-dim font-body">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full bg-obsidian border border-border rounded-sm pl-9 pr-3 py-2 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/40 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={passwordLoading}
                className="bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian font-body font-semibold text-xs px-4 py-2 rounded-sm transition-colors uppercase tracking-wider"
              >
                {passwordLoading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}
