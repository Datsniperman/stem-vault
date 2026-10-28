'use client';

import { X, ShieldAlert } from 'lucide-react';

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
