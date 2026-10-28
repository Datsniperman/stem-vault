import Link from 'next/link';
import { ArrowLeft, Shield, EyeOff, Lock } from 'lucide-react';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Privacy Policy | The Mixing Vault',
  description: 'Privacy Policy, data processing disclosures, and cookie policy for The Mixing Vault.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex flex-col font-sans">
      <Header />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to multitracks</span>
        </Link>

        <div className="bg-[#121212] border border-neutral-800 rounded-lg p-6 sm:p-8 space-y-8 shadow-xs">
          {/* Header Banner */}
          <div className="border-b border-neutral-800 pb-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5" />
              Privacy & Data Transparency
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">The Mixing Vault Privacy Policy</h1>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              This Privacy Policy explains how The Mixing Vault (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and discloses information about you when you use our website, services, and Discord integrations. We are committed to transparency and respect for user privacy under US Federal, California (CCPA/CPRA, CIPA), and European Union (GDPR) data protection laws.
            </p>
          </div>

          {/* Section 1: Session Replay & Wiretapping Protections */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">1</span>
              Affirmative Disclosure: No Session Replay or Keystroke Recording
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <EyeOff className="w-4 h-4 shrink-0 text-neutral-400" />
                <span>Zero Invasive Session Recording (California CIPA Compliance)</span>
              </div>
              <p className="text-neutral-300 leading-relaxed">
                We believe in full transparency regarding surveillance technologies. <strong className="text-white">The Mixing Vault does NOT deploy session replay software</strong> (such as Hotjar, FullStory, LogRocket, or Microsoft Clarity) and does <strong className="text-white">NOT record your keystrokes, mouse movements, screen activity, or form interactions</strong>.
              </p>
              <p className="text-neutral-400 leading-relaxed">
                Our site uses aggregate, privacy-preserving web analytics (via Vercel Analytics) to measure total page visits, country-level traffic, and basic performance. These analytics do not capture personally identifiable information, audio file playback recordings, or private chat interactions.
              </p>
            </div>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">2</span>
              Information We Collect
            </h2>
            <div className="space-y-3 text-xs text-neutral-400 leading-relaxed">
              <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-3.5 space-y-1">
                <p className="font-semibold text-white">A. Discord Authentication Data (OAuth 2.0)</p>
                <p>
                  When you sign in using Discord, we receive your Discord User ID, email address (if authorized), username, server nickname (within the Tyler Kerpsack All Access guild), and avatar URL. We do not receive or store your Discord password.
                </p>
              </div>

              <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-3.5 space-y-1">
                <p className="font-semibold text-white">B. Content You Submit</p>
                <p>
                  When you submit a multitrack session, mix entry, or comment, we store the title, artist name, musical key, BPM, third-party cloud storage links (e.g. Google Drive, Dropbox), DAW template links, your written mix notes, and your display name.
                </p>
              </div>

              <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-3.5 space-y-1">
                <p className="font-semibold text-white">C. Technical Logs & Cookies</p>
                <p>
                  We store authentication cookies and local preferences (e.g. cookie consent, audio playback volume) necessary for the operation of the web application. We do not sell your personal data or provide tracking data to data brokers.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Children's Privacy (COPPA & GDPR) */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">3</span>
              Children&apos;s Privacy (COPPA & Minimum Age)
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 text-xs space-y-2">
              <p className="text-neutral-300 leading-relaxed">
                The Service is strictly restricted to individuals who are at least 13 years old (or 16 in certain EU member states). We comply with the Children&apos;s Online Privacy Protection Act (COPPA). We do not knowingly collect personal information from children under 13.
              </p>
              <p className="text-neutral-400 leading-relaxed">
                If a parent or guardian becomes aware that their child has provided personal information to us without consent, please notify us immediately at <a href="mailto:privacy@stemvault.app" className="text-white underline">privacy@stemvault.app</a> or <a href="mailto:connorwbrown07@gmail.com" className="text-white underline">connorwbrown07@gmail.com</a>.
              </p>
            </div>
          </section>

          {/* Section 4: Self-Hosted Fonts & Zero CDN Leakage */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">4</span>
              Self-Hosted Fonts & Zero IP Address Leaks
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              In accordance with European data protection rulings, all website fonts are <strong className="text-white">pre-packaged and served directly from our own domain servers</strong> via Next.js Font Optimization. Your IP address is never transmitted to Google or external font CDNs when loading pages on our website.
            </p>
          </section>

          {/* Section 5: User Rights & Data Deletion */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">5</span>
              Your Privacy Rights (GDPR & CCPA/CPRA)
            </h2>
            <ul className="list-disc pl-5 text-xs text-neutral-400 space-y-1.5 leading-relaxed">
              <li><strong className="text-white">Right to Know / Access:</strong> Request a summary of the personal information we hold about you.</li>
              <li><strong className="text-white">Right to Delete:</strong> Request the complete deletion of your account and uploaded session links.</li>
              <li><strong className="text-white">Right to Opt-Out:</strong> We do not sell or share your personal data for cross-context behavioral advertising. You may manage marketing and operational email preferences at <Link href="/unsubscribe" className="text-white underline">our Preferences page</Link>.</li>
            </ul>
          </section>

          {/* Section 6: Contact & Physical Address */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">6</span>
              Contact Information
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 text-xs text-neutral-400 space-y-1 font-mono">
              <p><strong className="text-white">Data Controller:</strong> The Mixing Vault / Tyler Kerpsack All Access</p>
              <p><strong className="text-white">Privacy Officer:</strong> Connor Brown</p>
              <p><strong className="text-white">Email:</strong> <a href="mailto:privacy@stemvault.app" className="text-white underline">privacy@stemvault.app</a> or <a href="mailto:connorwbrown07@gmail.com" className="text-white underline">connorwbrown07@gmail.com</a></p>
              <p><strong className="text-white">Physical Address:</strong> P.O. Box 412, Nashville, TN 37203, United States</p>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="border-t border-neutral-800 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <span>•</span>
              <Link href="/dmca" className="hover:text-white transition-colors">DMCA Policy</Link>
              <span>•</span>
              <Link href="/unsubscribe" className="hover:text-white transition-colors">Email Preferences</Link>
            </div>
            <span>© {new Date().getFullYear()} The Mixing Vault</span>
          </div>
        </div>
      </main>
    </div>
  );
}
