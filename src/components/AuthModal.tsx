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
      setSuccessMessage(`Sign-in link sent to ${email}.`);
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
            <p className="text-dim text-sm font-body mt-0.5">Stem Vault</p>
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
                    placeholder="you@church.org"
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
                      placeholder="Min. 8 characters"
                      className="w-full bg-obsidian border border-border rounded-sm pl-9 pr-10 py-2.5 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/50 transition-colors"
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
                      placeholder="Re-type password"
                      className="w-full bg-obsidian border border-border rounded-sm pl-9 pr-3 py-2.5 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/50 transition-colors"
                    />
                  </div>
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
          )}
        </div>
      </div>
    </div>
  );
}
