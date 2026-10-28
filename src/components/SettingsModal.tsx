'use client';

import { useState, useEffect } from 'react';
import { X, User, Lock, Eye, EyeOff } from 'lucide-react';
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
    const cleanName = username.trim().replace(/^@/, '');
    if (!cleanName) {
      addToast('Username cannot be empty.', 'error');
      return;
    }

    setUsernameLoading(true);
    try {
      const supabase: any = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Client unavailable');

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ display_name: cleanName })
        .eq('id', user.id);

      if (profileErr) {
        addToast(`Failed to update profile: ${profileErr.message}`, 'error');
        return;
      }

      await supabase.auth.updateUser({
        data: { display_name: cleanName },
      });

      addToast(`Username updated to @${cleanName}.`, 'success');
      await refreshProfile();
    } catch (err: any) {
      addToast(err?.message || 'Failed to update username.', 'error');
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
      const supabase: any = getSupabaseBrowserClient();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#313338] border border-[#1f2023] rounded-lg w-full max-w-md max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-xs">

        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f2023] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[#f2f3f5]">User Settings</h2>
            <p className="text-[#949ba4] text-[11px] mt-0.5">Manage handle and password</p>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-[#f2f3f5] p-1 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">

          {/* Account Overview Badge */}
          <div className="bg-[#2b2d31] border border-[#1f2023] rounded p-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] text-[#949ba4]">Discord Email</p>
              <p className="text-xs text-[#f2f3f5] font-medium truncate mt-0.5">{user.email}</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1e1f22] text-[#949ba4]">
              {profile?.role === 'admin' ? 'ADMIN' : profile?.role === 'verified' ? 'PRO TECH' : 'MEMBER'}
            </span>
          </div>

          {/* Section 1: Change Username */}
          <form onSubmit={handleUpdateUsername} className="space-y-2.5">
            <h3 className="text-xs font-bold text-[#f2f3f5] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>Display Handle</span>
            </h3>

            <div className="space-y-1">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#80848e] font-mono text-xs">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="mixguy"
                  className="w-full bg-[#1e1f22] border border-[#1f2023] rounded pl-7 pr-3 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={usernameLoading}
                className="bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white font-medium text-xs px-3.5 py-1.5 rounded transition-colors"
              >
                {usernameLoading ? 'Saving…' : 'Save Handle'}
              </button>
            </div>
          </form>

          <hr className="border-[#1f2023]" />

          {/* Section 2: Change Password */}
          <form onSubmit={handleUpdatePassword} className="space-y-2.5">
            <h3 className="text-xs font-bold text-[#f2f3f5] uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>Change Password</span>
            </h3>

            <div className="space-y-1">
              <label className="block text-[11px] text-[#949ba4]">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-[#1e1f22] border border-[#1f2023] rounded pl-3 pr-8 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#949ba4] hover:text-[#f2f3f5]"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-[#949ba4]">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading}
                className="bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white font-medium text-xs px-3.5 py-1.5 rounded transition-colors"
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
