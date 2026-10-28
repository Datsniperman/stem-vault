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
      <div className="bg-[#121212] border border-neutral-800 rounded-lg p-4 shadow-2xl space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 text-white">
            <Cookie className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-xs font-semibold text-white">Cookie & Privacy Settings</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              We use essential cookies for authentication and performance metrics. We do <strong className="text-neutral-200">not</strong> record sessions or log keystrokes. Read our{' '}
              <Link href="/privacy" className="text-white hover:underline underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
          <button
            onClick={() => handleChoice('essential')}
            className="text-neutral-500 hover:text-white p-0.5"
            aria-label="Close cookie banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/80">
          <button
            onClick={() => handleChoice('essential')}
            className="px-2.5 py-1 text-[11px] text-neutral-400 hover:text-white"
          >
            Essential Only
          </button>
          <button
            onClick={() => handleChoice('all')}
            className="bg-white hover:bg-neutral-200 text-black text-[11px] font-semibold px-3 py-1 rounded transition-colors shadow-xs"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
