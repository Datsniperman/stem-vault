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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#313338] border border-[#1f2023] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f2023] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#5865F2]" />
            <h2 className="text-base font-bold text-[#f2f3f5]">Server Rules & Vault Guidelines</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-[#f2f3f5] p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3.5 text-xs text-[#dbdee1] leading-relaxed overflow-y-auto">
          <div className="bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-[#949ba4] space-y-1">
            <p className="font-semibold text-[#f2f3f5]">Tyler Kerpsack All Access Community Hub</p>
            <p>
              The Mixing Vault is the private worship multitrack library for Tyler Kerpsack All Access Discord members.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#f2f3f5] uppercase tracking-wider text-[11px]">Server Rules:</h3>

            <ul className="list-disc pl-4 space-y-1.5 text-xs text-[#949ba4]">
              <li>
                <strong className="text-[#dbdee1]">Age Gate (13+):</strong> You must be at least 13 years of age (or 16 in certain EU member states) to join, browse, or participate in accordance with COPPA and Discord Terms.
              </li>
              <li>
                <strong className="text-[#dbdee1]">Discord Authentication:</strong> You must be an active member of the All Access Discord server to download multitracks and post mix critiques.
              </li>
              <li>
                <strong className="text-[#dbdee1]">Practice & Educational Use:</strong> All multitracks and DAW templates are intended solely for peer critique, educational study, and mixing practice. Commercial resale is strictly prohibited.
              </li>
              <li>
                <strong className="text-[#dbdee1]">KerpBot Thread Integration:</strong> Every multitrack and mix submission automatically triggers a post in Discord. Keep critiques helpful and constructive.
              </li>
            </ul>
          </div>

          {/* Legal Policies Links */}
          <div className="pt-2 border-t border-[#1f2023] space-y-1.5 text-[11px] text-[#949ba4]">
            <p className="font-semibold text-[#dbdee1]">Legal Policies & Disclosures:</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/terms" onClick={onClose} className="text-[#5865F2] hover:underline flex items-center gap-1">
                Terms of Service <ExternalLink className="w-3 h-3" />
              </Link>
              <span>•</span>
              <Link href="/privacy" onClick={onClose} className="text-[#5865F2] hover:underline flex items-center gap-1">
                Privacy Policy <ExternalLink className="w-3 h-3" />
              </Link>
              <span>•</span>
              <Link href="/dmca" onClick={onClose} className="text-[#5865F2] hover:underline flex items-center gap-1">
                DMCA Guidelines <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-[#2b2d31] border-t border-[#1f2023] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-xs px-4 py-1.5 rounded transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
