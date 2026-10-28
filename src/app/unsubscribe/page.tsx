'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export default function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [unsubscribedAll, setUnsubscribedAll] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-14 border-b border-neutral-800 bg-[#0a0a0a] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Vault</span>
          </Link>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-neutral-300" />
            <h1 className="text-sm font-semibold text-white">Email Preferences</h1>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full px-4 py-16 flex-1 flex flex-col justify-center">
        <div className="bg-[#121212] border border-neutral-800 rounded-lg p-6 shadow-xl space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-white mb-3">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white">Manage Notifications</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              In compliance with the CAN-SPAM Act, you can opt out of automated announcements and dead link notifications at any time.
            </p>
          </div>

          {submitted ? (
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-5 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-white mx-auto" />
              <h3 className="text-sm font-semibold text-white">Preferences Updated</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                <strong className="text-white">{email}</strong> has been unsubscribed from all optional email communications. Essential account security notifications will remain active.
              </p>
              <Link
                href="/"
                className="inline-block text-xs text-white underline pt-2 font-medium"
              >
                Return to The Mixing Vault
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-neutral-400">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full bg-[#0d0d0e] border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div className="bg-[#0d0d0e] border border-neutral-800 rounded p-3 space-y-2 text-xs">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unsubscribedAll}
                    onChange={e => setUnsubscribedAll(e.target.checked)}
                    className="mt-0.5 accent-white"
                  />
                  <span className="text-neutral-300">Unsubscribe from all non-critical emails and community updates</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-white hover:bg-neutral-200 text-black font-semibold py-2 rounded text-xs transition-colors shadow-xs"
              >
                Save Preferences & Unsubscribe
              </button>
            </form>
          )}

          {/* CAN-SPAM Sender Information */}
          <div className="border-t border-neutral-800 pt-4 text-[11px] text-neutral-400 space-y-1 text-center font-mono">
            <p className="font-semibold text-neutral-200">The Mixing Vault • Tyler Kerpsack All Access</p>
            <p>P.O. Box 412, Nashville, TN 37203, United States</p>
          </div>
        </div>
      </main>
    </div>
  );
}
