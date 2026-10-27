'use client';

import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, User, KeyRound, Info } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/context/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'magic' | 'forgot';

function getOrigin() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://stem-vault-tau.vercel.app';
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { addToast } = useToast();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail(''); setUsername(''); setPassword(''); setConfirmPassword(''); setError(''); setSuccessMessage(null); setMode('signin');
    onClose();
  };

  const handleDiscordSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase client unavailable.');

      const { error: supaErr } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          scopes: 'identify guilds guilds.members.read',
          redirectTo: `${getOrigin()}/auth/callback`,
        },
      });

      if (supaErr) {
        setError(supaErr.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Discord.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email is required.'); return; }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase client unavailable.');

      const { error: supaErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getOrigin()}/auth/reset-password`,
      });

      if (supaErr) { setError(supaErr.message); return; }
      setSuccessMessage(`Password reset link sent to ${email}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email is required.'); return; }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase client unavailable.');

      const { error: supaErr } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getOrigin()}/auth/callback`,
          shouldCreateUser: true,
        },
      });

      if (supaErr) { setError(supaErr.message); return; }
      setSuccessMessage(`Magic link sent to ${email}. Check your inbox!`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) { setError('Email is required.'); return; }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    if (mode === 'signup') {
      if (!username.trim()) { setError('Username / Display Name is required.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase client unavailable.');

      if (mode === 'signup') {
        const handleClean = username.trim().replace(/^@/, '');
        const { error: supaErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getOrigin()}/auth/callback`,
            data: {
              display_name: handleClean,
            },
          },
        });

        if (supaErr) { setError(supaErr.message); return; }
        setSuccessMessage(`Account created! A confirmation email was sent to ${email}.`);
      } else {
        const { error: supaErr } = await supabase.auth.signInWithPassword({ email, password });
        if (supaErr) { setError(supaErr.message); return; }
        addToast('Signed in successfully.', 'success');
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-surface border border-border rounded-sm w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-warm-white">
              {mode === 'magic'
                ? 'Magic link sign-in'
                : mode === 'signup'
                ? 'Create account'
                : mode === 'forgot'
                ? 'Reset password'
                : 'Sign in'}
            </h2>
            <p className="text-dim text-sm font-body mt-0.5">Tyler Kerpsack All Access</p>
          </div>
          <button onClick={handleClose} className="text-dim hover:text-warm-white p-1 transition-colors rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {successMessage ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-dim border border-amber/30 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6 text-amber" />
              </div>

              <div>
                <p className="font-body text-warm-white text-lg font-medium">Check your inbox</p>
                <p className="text-dim text-sm font-body leading-relaxed mt-1">{successMessage}</p>
              </div>

              {/* Spam Box Warning */}
              <div className="flex items-start gap-2.5 bg-amber-dim border border-amber/25 rounded-sm p-3.5 text-left">
                <Info className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                <p className="text-xs text-amber font-body leading-relaxed">
                  <strong>Can't find the email?</strong> Make sure to check your <strong>Spam / Junk folder</strong>. Automatic emails often land there on first delivery.
                </p>
              </div>

              <button
                onClick={() => setSuccessMessage(null)}
                className="mt-4 text-sm text-dim hover:text-warm-white underline transition-colors font-body"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <div>
              {/* Primary: Sign in with Discord */}
              <button
                type="button"
                onClick={handleDiscordSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white font-body font-semibold py-2.5 px-4 rounded-sm transition-colors text-sm shadow-md mb-4"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Sign in with Discord (Recommended)
              </button>

              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-border" />
                <span className="px-3 text-xs text-dim uppercase tracking-wider font-body">or email sign-in</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <form
                onSubmit={
                  mode === 'magic'
                    ? handleMagicLink
                    : mode === 'forgot'
                    ? handleForgotPass
                    : handlePasswordAuth
                }
                className="space-y-4"
              >
                {error && (
                  <div className="flex items-start gap-2 bg-error/10 border border-error/30 rounded-sm px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                    <span className="text-sm text-error font-body">{error}</span>
                  </div>
                )}

                {/* Username (Sign up only) */}
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs text-dim font-body">Username / Handle *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="e.g. mixguy_foh"
                        className="w-full bg-obsidian border border-border rounded-sm pl-9 pr-3 py-2.5 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/50 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs text-dim font-body">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full bg-obsidian border border-border rounded-sm pl-9 pr-3 py-2.5 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                {mode !== 'magic' && mode !== 'forgot' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs text-dim font-body">Password *</label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-xs text-amber hover:underline font-body"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-obsidian border border-border rounded-sm pl-9 pr-10 py-2.5 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-warm-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Password (Sign up only) */}
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs text-dim font-body">Confirm Password *</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-obsidian border border-border rounded-sm pl-9 pr-3 py-2.5 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/50 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Terms of Service Checkbox (Sign up only) */}
                {mode === 'signup' && (
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="accept-terms"
                      required
                      className="mt-0.5 accent-amber rounded-sm cursor-pointer"
                    />
                    <label htmlFor="accept-terms" className="text-xs text-dim font-body leading-tight cursor-pointer">
                      I accept the <span className="text-warm-white underline font-semibold">Terms of Service</span> (confirming all uploaded files are authorized for community practice).
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian font-body font-bold py-2.5 rounded-sm transition-colors text-sm uppercase tracking-wider"
                >
                  {loading
                    ? 'Please wait…'
                    : mode === 'magic'
                    ? 'Send magic link'
                    : mode === 'forgot'
                    ? 'Send reset link'
                    : mode === 'signup'
                    ? 'Create account'
                    : 'Sign in'}
                </button>

                {/* Mode toggles */}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  {mode === 'forgot' ? (
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="text-xs text-dim hover:text-warm-white transition-colors font-body"
                    >
                      ← Back to sign in
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setMode(m => m === 'magic' ? 'signin' : 'magic')}
                        className="text-xs text-dim hover:text-amber transition-colors font-body"
                      >
                        {mode === 'magic' ? 'Use password' : 'Use magic link'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
                        className="text-xs text-dim hover:text-amber transition-colors font-body"
                      >
                        {mode === 'signin' ? 'Create account' : 'Sign in instead'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
