'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('tmv_cookie_consent');
      if (!consent) {
        setVisible(true);
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  const handleChoice = (preference: 'all' | 'essential') => {
    try {
      localStorage.setItem('tmv_cookie_consent', preference);
    } catch {
      // Ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-[fade-in_0.2s_ease-out]">
      <div className="bg-[#2b2d31] border border-[#1f2023] rounded-lg p-4 shadow-2xl space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center shrink-0 text-[#5865F2]">
            <Cookie className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-xs font-bold text-[#f2f3f5]">Cookie & Privacy Settings</h4>
            <p className="text-[11px] text-[#949ba4] leading-relaxed">
              We use essential cookies for Discord authentication and anonymous performance metrics. We do <strong className="text-[#dbdee1]">not</strong> track keystrokes or use session replay. Read our{' '}
              <Link href="/privacy" className="text-[#5865F2] hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
          <button
            onClick={() => handleChoice('essential')}
            className="text-[#949ba4] hover:text-[#f2f3f5] p-0.5"
            aria-label="Close cookie banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#1f2023]">
          <button
            onClick={() => handleChoice('essential')}
            className="px-2.5 py-1 text-[11px] text-[#949ba4] hover:text-[#f2f3f5] hover:underline"
          >
            Essential Only
          </button>
          <button
            onClick={() => handleChoice('all')}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-[11px] font-semibold px-3 py-1 rounded transition-colors shadow-xs"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
