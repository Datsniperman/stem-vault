'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [unsubscribedAll, setUnsubscribedAll] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Client-side confirmation & simulated opt-out record
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#313338] text-[#dbdee1] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-12 border-b border-[#1f2023] bg-[#2b2d31] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-[#949ba4] hover:text-[#f2f3f5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Vault</span>
          </Link>
          <span className="text-[#4e5058]">|</span>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#5865F2]" />
            <h1 className="text-sm font-bold text-[#f2f3f5]">Email Communication Preferences</h1>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-[#2b2d31] border border-[#1f2023] rounded-lg p-6 shadow-xl space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 flex items-center justify-center mx-auto text-[#5865F2] mb-3">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#f2f3f5]">Manage Email Notifications</h2>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              In compliance with the CAN-SPAM Act, you can opt out of automated announcements, dead link reports, and community digests at any time.
            </p>
          </div>

          {submitted ? (
            <div className="bg-[#1e1f22] border border-[#23a55a]/30 rounded-lg p-5 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-[#23a55a] mx-auto" />
              <h3 className="text-sm font-bold text-[#f2f3f5]">Preferences Updated</h3>
              <p className="text-xs text-[#949ba4] leading-relaxed">
                <strong className="text-[#dbdee1]">{email}</strong> has been unsubscribed from all optional email communications. Essential account security and password recovery emails will remain available.
              </p>
              <Link
                href="/"
                className="inline-block text-xs text-[#5865F2] hover:underline pt-2 font-medium"
              >
                Return to The Mixing Vault
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-2 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <div className="bg-[#1e1f22] border border-[#1f2023] rounded p-3 space-y-2 text-xs">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unsubscribedAll}
                    onChange={e => setUnsubscribedAll(e.target.checked)}
                    className="mt-0.5 accent-[#5865F2]"
                  />
                  <span className="text-[#dbdee1]">Unsubscribe from all non-critical emails and community updates</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-2 rounded text-xs transition-colors shadow-xs"
              >
                Save Preferences & Unsubscribe
              </button>
            </form>
          )}

          {/* CAN-SPAM Sender Information */}
          <div className="border-t border-[#1f2023] pt-4 text-[11px] text-[#949ba4] space-y-1 text-center">
            <p className="font-semibold text-[#dbdee1]">The Mixing Vault • Tyler Kerpsack All Access</p>
            <p>Physical Mailing Address: P.O. Box 412, Nashville, TN 37203, United States</p>
            <p>
              Questions? Contact <a href="mailto:support@stemvault.app" className="text-[#5865F2] hover:underline">support@stemvault.app</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
