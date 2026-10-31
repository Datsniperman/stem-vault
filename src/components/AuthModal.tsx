'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, User, KeyRound, Info, ShieldCheck } from 'lucide-react';
import { getDbBrowserClient } from '@/lib/db/client';
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
  return 'https://www.mixingvault.com';
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
  const [ageAgreed, setAgeAgreed] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail(''); setUsername(''); setPassword(''); setConfirmPassword(''); setError(''); setSuccessMessage(null); setAgeAgreed(false); setMode('signin');
    onClose();
  };

  const handleDiscordSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const db = getDbBrowserClient();
      if (!db) throw new Error('Database client unavailable.');

      const { error: dbErr } = await db.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          scopes: 'identify guilds guilds.members.read',
          redirectTo: typeof window !== 'undefined' ? (window.location.pathname || '/') : '/',
        },
      });

      if (dbErr) {
        setError(dbErr.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to Discord.');
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
      const db = getDbBrowserClient();
      if (!db) throw new Error('Database client unavailable.');

      const { error: dbErr } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: `${getOrigin()}/auth/reset-password`,
      });

      if (dbErr) { setError(dbErr.message); return; }
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
      const db = getDbBrowserClient();
      if (!db) throw new Error('Database client unavailable.');

      const { error: dbErr } = await db.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getOrigin()}/auth/callback`,
          shouldCreateUser: true,
        },
      });

      if (dbErr) { setError(dbErr.message); return; }
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
      if (!ageAgreed) { setError('You must certify that you are at least 13 years of age and agree to the Terms of Service.'); return; }
    }

    setLoading(true);
    try {
      const db = getDbBrowserClient();
      if (!db) throw new Error('Database client unavailable.');

      if (mode === 'signup') {
        const handleClean = username.trim().replace(/^@/, '');
        const { error: dbErr } = await db.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getOrigin()}/auth/callback`,
            data: {
              display_name: handleClean,
            },
          },
        });

        if (dbErr) { setError(dbErr.message); return; }
        setSuccessMessage(`Account created! A confirmation email was sent to ${email}.`);
      } else {
        const { error: dbErr } = await db.auth.signInWithPassword({ email, password });
        if (dbErr) { setError(dbErr.message); return; }
        addToast('Signed in successfully.', 'success');
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-[#121212] border border-neutral-800 rounded-lg w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              {mode === 'magic'
                ? 'Magic link sign-in'
                : mode === 'signup'
                ? 'Create account'
                : mode === 'forgot'
                ? 'Reset password'
                : 'Sign in to All Access'}
            </h2>
            <p className="text-neutral-500 text-[11px] mt-0.5">Tyler Kerpsack Discord Community</p>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {successMessage ? (
            <div className="text-center py-3 space-y-3">
              <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center mx-auto text-white">
                <Mail className="w-5 h-5" />
              </div>

              <div>
                <p className="text-white text-sm font-semibold">Check your inbox</p>
                <p className="text-neutral-400 text-xs mt-1 leading-relaxed">{successMessage}</p>
              </div>

              <button
                onClick={() => setSuccessMessage(null)}
                className="text-xs text-neutral-300 hover:text-white underline font-medium block mx-auto"
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
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-semibold py-2.5 px-4 rounded transition-colors text-xs shadow-xs mb-2"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Continue with Discord</span>
              </button>

              <p className="text-[10px] text-neutral-400 text-center leading-relaxed mb-3 px-1">
                By continuing, you certify that you are at least 13 years old and agree to our{' '}
                <Link href="/terms" target="_blank" className="text-white hover:underline">Terms</Link>,{' '}
                <Link href="/privacy" target="_blank" className="text-white hover:underline">Privacy Policy</Link>, and{' '}
                <Link href="/dmca" target="_blank" className="text-white hover:underline">DMCA Policy</Link>.
              </p>

              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-neutral-800" />
                <span className="px-2 text-[10px] text-neutral-400 uppercase font-mono">or email</span>
                <div className="flex-1 border-t border-neutral-800" />
              </div>

              <form
                onSubmit={
                  mode === 'magic'
                    ? handleMagicLink
                    : mode === 'forgot'
                    ? handleForgotPass
                    : handlePasswordAuth
                }
                className="space-y-3 text-xs"
              >
                {error && (
                  <div className="flex items-start gap-2 bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-neutral-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Username */}
                {mode === 'signup' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono uppercase text-neutral-400">Username *</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="e.g. mixguy"
                      className="w-full bg-[#0d0d0e] border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono uppercase text-neutral-400">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@church.org"
                    className="w-full bg-[#0d0d0e] border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500"
                  />
                </div>

                {/* Password */}
                {mode !== 'magic' && mode !== 'forgot' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-mono uppercase text-neutral-400">Password *</label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-[11px] text-neutral-400 hover:text-white hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0d0d0e] border border-neutral-800 rounded pl-3 pr-8 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                {mode === 'signup' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono uppercase text-neutral-400">Confirm Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0d0d0e] border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                )}

                {/* Age Gate & Legal Certification */}
                {mode === 'signup' && (
                  <div className="flex items-start gap-2 pt-1 pb-1">
                    <input
                      id="signup-age-gate"
                      type="checkbox"
                      checked={ageAgreed}
                      onChange={e => setAgeAgreed(e.target.checked)}
                      className="mt-0.5 accent-white rounded cursor-pointer"
                    />
                    <label htmlFor="signup-age-gate" className="text-[11px] text-neutral-400 leading-tight cursor-pointer">
                      I certify that I am at least 13 years old and agree to the{' '}
                      <Link href="/terms" target="_blank" className="text-white hover:underline">Terms of Service</Link>{' '}
                      and{' '}
                      <Link href="/privacy" target="_blank" className="text-white hover:underline">Privacy Policy</Link>.
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-medium py-2 rounded transition-colors text-xs mt-1"
                >
                  {loading
                    ? 'Please wait…'
                    : mode === 'magic'
                    ? 'Send Magic Link'
                    : mode === 'forgot'
                    ? 'Reset Password'
                    : mode === 'signup'
                    ? 'Create Account'
                    : 'Sign In'}
                </button>

                {/* Mode toggles */}
                <div className="flex justify-between items-center pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
                  {mode === 'forgot' ? (
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="hover:underline hover:text-white"
                    >
                      ← Back to sign in
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setMode(m => m === 'magic' ? 'signin' : 'magic')}
                        className="hover:text-white"
                      >
                        {mode === 'magic' ? 'Use password' : 'Use magic link'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
                        className="hover:text-white"
                      >
                        {mode === 'signin' ? 'Create account' : 'Sign in'}
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
