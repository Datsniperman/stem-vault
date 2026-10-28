'use client';

import Link from 'next/link';
import { X, ShieldAlert, ExternalLink } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#121212] border border-neutral-800 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-neutral-300" />
            <h2 className="text-base font-semibold text-white">Guidelines & Rules</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-neutral-300 leading-relaxed overflow-y-auto">
          <div className="bg-[#0d0d0e] border border-neutral-800 rounded p-3 text-neutral-400 space-y-1">
            <p className="font-semibold text-white">Tyler Kerpsack All Access Community Hub</p>
            <p>
              The Mixing Vault is the private worship multitrack archive for Tyler Kerpsack All Access members.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono uppercase tracking-wider text-[11px] text-neutral-400">Rules & Usage:</h3>

            <ul className="list-disc pl-4 space-y-1.5 text-xs text-neutral-400">
              <li>
                <strong className="text-neutral-200">Age Requirement (13+):</strong> You must be at least 13 years of age (or 16 in certain EU member states) to use this service under COPPA and platform terms.
              </li>
              <li>
                <strong className="text-neutral-200">Community Access:</strong> You must be an active member of the All Access Discord server to download multitracks and post mixes.
              </li>
              <li>
                <strong className="text-neutral-200">Practice & Educational Use:</strong> All multitracks and DAW templates are intended solely for peer critique, educational study, and mixing practice. Commercial resale is strictly prohibited.
              </li>
              <li>
                <strong className="text-neutral-200">Discord Thread Integration:</strong> Every multitrack and mix submission automatically triggers a post in Discord. Keep critiques constructive.
              </li>
            </ul>
          </div>

          {/* Legal Policies Links */}
          <div className="pt-3 border-t border-neutral-800 space-y-1.5 text-[11px] text-neutral-400">
            <p className="font-semibold text-neutral-300">Legal Disclosures:</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/terms" onClick={onClose} className="text-white hover:underline flex items-center gap-1">
                Terms of Service <ExternalLink className="w-3 h-3" />
              </Link>
              <span>•</span>
              <Link href="/privacy" onClick={onClose} className="text-white hover:underline flex items-center gap-1">
                Privacy Policy <ExternalLink className="w-3 h-3" />
              </Link>
              <span>•</span>
              <Link href="/dmca" onClick={onClose} className="text-white hover:underline flex items-center gap-1">
                DMCA Guidelines <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-[#0d0d0e] border-t border-neutral-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-1.5 rounded transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
