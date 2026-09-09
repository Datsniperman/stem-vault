'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Music2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/context/ToastContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase client unavailable.');

      const { error: supaErr } = await supabase.auth.updateUser({
        password,
      });

      if (supaErr) {
        setError(supaErr.message);
        return;
      }

      setSuccess(true);
      addToast('Password updated successfully!', 'success');
      setTimeout(() => {
        router.push('/');
      }, 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-warm-white flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-sm w-full max-w-md shadow-2xl p-6 space-y-6">

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-border">
          <div className="w-8 h-8 bg-amber rounded-sm flex items-center justify-center">
            <Music2 className="w-4.5 h-4.5 text-obsidian" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-body font-bold text-warm-white text-base">Stem Vault</h1>
            <p className="text-xs text-dim font-body">Set new password</p>
          </div>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-amber mx-auto" />
            <h2 className="font-display text-xl text-warm-white">Password Updated!</h2>
            <p className="text-sm text-dim font-body">Redirecting you to the home page…</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 bg-error/10 border border-error/30 rounded-sm px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <span className="text-sm text-error font-body">{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs text-dim font-body">New Password *</label>
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

            <div className="space-y-1.5">
              <label className="block text-xs text-dim font-body">Confirm New Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full bg-obsidian border border-border rounded-sm pl-9 pr-3 py-2.5 text-warm-white font-body text-sm focus:outline-none focus:border-amber placeholder:text-dim/50 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian font-body font-bold py-2.5 rounded-sm transition-colors text-sm uppercase tracking-wider"
            >
              {loading ? 'Updating…' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
