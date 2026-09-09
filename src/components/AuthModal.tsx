'use client';

import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/context/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'magic';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { addToast } = useToast();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail(''); setPassword(''); setError(''); setMagicSent(false); setMode('signin');
    onClose();
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });

      if (supaErr) { setError(supaErr.message); return; }
      setMagicSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email is required.'); return; }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase client unavailable.');

      const fn = mode === 'signup'
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });

      const { error: supaErr } = await fn;
      if (supaErr) { setError(supaErr.message); return; }

      if (mode === 'signup') {
        setMagicSent(true);
      } else {
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
              {mode === 'magic' ? 'Magic link' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </h2>
            <p className="text-dim text-sm font-body mt-0.5">Stem Vault</p>
          </div>
          <button onClick={handleClose} className="text-dim hover:text-warm-white p-1 transition-colors rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {magicSent ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-amber/10 border border-amber/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-5 h-5 text-amber" />
              </div>
              <p className="font-body text-warm-white mb-2 font-medium">Check your inbox</p>
              <p className="text-dim text-sm font-body">
                A {mode === 'signup' ? 'confirmation' : 'sign-in'} link was sent to{' '}
                <span className="text-warm-white">{email}</span>
              </p>
              <button
                onClick={() => setMagicSent(false)}
                className="mt-6 text-sm text-dim hover:text-warm-white underline transition-colors font-body"
              >
                Try again
              </button>
            </div>
          ) : (
            <form onSubmit={mode === 'magic' ? handleMagicLink : handlePasswordAuth} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-error/10 border border-error/30 rounded-sm px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                  <span className="text-sm text-error font-body">{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs text-dim font-body">Email</label>
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
              {mode !== 'magic' && (
                <div className="space-y-1.5">
                  <label className="block text-xs text-dim font-body">Password</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian font-body font-bold py-2.5 rounded-sm transition-colors text-sm"
              >
                {loading ? 'Please wait…' : mode === 'magic' ? 'Send magic link' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>

              {/* Mode toggles */}
              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={() => setMode(m => m === 'magic' ? 'signin' : 'magic')}
                  className="text-sm text-dim hover:text-amber transition-colors font-body"
                >
                  {mode === 'magic' ? 'Use password instead' : 'Use magic link'}
                </button>
                {mode !== 'magic' && (
                  <button
                    type="button"
                    onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
                    className="text-sm text-dim hover:text-amber transition-colors font-body"
                  >
                    {mode === 'signin' ? 'Create account' : 'Sign in instead'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
