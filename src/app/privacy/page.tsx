import Link from 'next/link';
import { ArrowLeft, Shield, EyeOff, Lock, Database, UserCheck, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy, data processing disclosures, and cookie policy for The Mixing Vault.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#313338] text-[#dbdee1] flex flex-col font-sans">
      {/* Top Discord Server Channel Bar */}
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
            <Lock className="w-4 h-4 text-[#5865F2]" />
            <h1 className="text-sm font-bold text-[#f2f3f5]">Privacy Policy</h1>
          </div>
        </div>
        <span className="text-[11px] text-[#949ba4]">Effective Date: October 28, 2026</span>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        <div className="bg-[#2b2d31] border border-[#1f2023] rounded-lg p-6 sm:p-8 space-y-8">
          {/* Header Banner */}
          <div className="border-b border-[#1f2023] pb-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#5865F2]/10 border border-[#5865F2]/25 text-[#5865F2] text-xs font-semibold uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5" />
              Privacy & Data Transparency
            </div>
            <h2 className="text-2xl font-bold text-[#f2f3f5]">The Mixing Vault Privacy Policy</h2>
            <p className="text-xs text-[#949ba4] mt-2 leading-relaxed">
              This Privacy Policy explains how The Mixing Vault (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and discloses information about you when you use our website, services, and Discord integrations. We are committed to transparency and respect for user privacy under US Federal, California (CCPA/CPRA, CIPA), and European Union (GDPR) data protection laws.
            </p>
          </div>

          {/* Section 1: Session Replay & Wiretapping Protections */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f2f3f5] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1e1f22] text-[#5865F2] flex items-center justify-center text-xs">1</span>
              Affirmative Disclosure: No Session Replay or Keystroke Recording
            </h3>
            <div className="bg-[#1e1f22] border border-[#23a55a]/30 rounded p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#23a55a] font-semibold">
                <EyeOff className="w-4 h-4 shrink-0" />
                <span>Zero Invasive Session Recording (California CIPA Compliance)</span>
              </div>
              <p className="text-[#dbdee1] leading-relaxed">
                We believe in full transparency regarding surveillance technologies. <strong className="text-[#f2f3f5]">The Mixing Vault does NOT deploy session replay software</strong> (such as Hotjar, FullStory, LogRocket, or Microsoft Clarity) and does <strong className="text-[#f2f3f5]">NOT record your keystrokes, mouse movements, screen activity, or form interactions</strong>.
              </p>
              <p className="text-[#949ba4] leading-relaxed">
                Our site uses aggregate, privacy-preserving web analytics (via Vercel Analytics) to measure total page visits, country-level traffic, and basic performance. These analytics do not capture personally identifiable information, audio file playback recordings, or private chat interactions.
              </p>
            </div>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f2f3f5] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1e1f22] text-[#5865F2] flex items-center justify-center text-xs">2</span>
              Information We Collect
            </h3>
            <div className="space-y-3 text-xs text-[#949ba4] leading-relaxed">
              <div className="bg-[#1e1f22] border border-[#1f2023] rounded p-3 space-y-1">
                <p className="font-semibold text-[#f2f3f5]">A. Discord Authentication Data (OAuth 2.0)</p>
                <p>
                  When you sign in using Discord, we receive your Discord User ID, email address (if authorized), username, server nickname (within the Tyler Kerpsack All Access guild), and avatar URL. We do not receive or store your Discord password.
                </p>
              </div>

              <div className="bg-[#1e1f22] border border-[#1f2023] rounded p-3 space-y-1">
                <p className="font-semibold text-[#f2f3f5]">B. Content You Submit</p>
                <p>
                  When you submit a multitrack session, mix entry, or comment, we store the title, artist name, musical key, BPM, third-party cloud storage links (e.g. Google Drive, Dropbox), DAW template links, your written mix notes, and your display name.
                </p>
              </div>

              <div className="bg-[#1e1f22] border border-[#1f2023] rounded p-3 space-y-1">
                <p className="font-semibold text-[#f2f3f5]">C. Technical Logs & Cookies</p>
                <p>
                  We store authentication cookies and local preferences (e.g. cookie consent, audio playback volume) necessary for the operation of the web application. We do not sell your personal data or provide tracking data to data brokers.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Children's Privacy (COPPA & GDPR) */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f2f3f5] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1e1f22] text-[#5865F2] flex items-center justify-center text-xs">3</span>
              Children&apos;s Privacy (COPPA & Minimum Age)
            </h3>
            <div className="bg-[#1e1f22] border border-[#f23f43]/30 rounded p-4 text-xs space-y-2">
              <p className="text-[#dbdee1] leading-relaxed">
                The Service is strictly restricted to individuals who are at least 13 years old (or 16 in certain EU member states). We comply with the Children&apos;s Online Privacy Protection Act (COPPA). We do not knowingly collect personal information from children under 13.
              </p>
              <p className="text-[#949ba4] leading-relaxed">
                If a parent or guardian becomes aware that their child has provided personal information to us without consent, please notify us immediately at <a href="mailto:privacy@stemvault.app" className="text-[#5865F2] hover:underline">privacy@stemvault.app</a> or <a href="mailto:connorwbrown07@gmail.com" className="text-[#5865F2] hover:underline">connorwbrown07@gmail.com</a>, and we will promptly purge the data and terminate the account.
              </p>
            </div>
          </section>

          {/* Section 4: Self-Hosted Fonts & Zero CDN Leakage */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f2f3f5] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1e1f22] text-[#5865F2] flex items-center justify-center text-xs">4</span>
              Self-Hosted Fonts & Zero IP Address Leaks
            </h3>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              In accordance with European data protection rulings (e.g., Landgericht München I ruling on Google Fonts), all website fonts (Inter) are <strong className="text-[#f2f3f5]">pre-packaged and served directly from our own domain servers</strong> via Next.js Font Optimization. Your IP address is never transmitted to Google or external font CDNs when loading pages on our website.
            </p>
          </section>

          {/* Section 5: User Rights & Data Deletion */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f2f3f5] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1e1f22] text-[#5865F2] flex items-center justify-center text-xs">5</span>
              Your Privacy Rights (GDPR & CCPA/CPRA)
            </h3>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              Depending on your jurisdiction, you have statutory rights regarding your personal information:
            </p>
            <ul className="list-disc pl-5 text-xs text-[#949ba4] space-y-1 leading-relaxed">
              <li><strong className="text-[#f2f3f5]">Right to Know / Access:</strong> Request a summary of the personal information we hold about you.</li>
              <li><strong className="text-[#f2f3f5]">Right to Delete:</strong> Request the complete deletion of your account and uploaded session links.</li>
              <li><strong className="text-[#f2f3f5]">Right to Opt-Out:</strong> We do not sell or share your personal data for cross-context behavioral advertising. You may manage marketing and operational email preferences at <Link href="/unsubscribe" className="text-[#5865F2] hover:underline">our Unsubscribe / Preferences page</Link>.</li>
            </ul>
          </section>

          {/* Section 6: Contact & Physical Address */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f2f3f5] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1e1f22] text-[#5865F2] flex items-center justify-center text-xs">6</span>
              Contact Information
            </h3>
            <div className="bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-xs text-[#949ba4] space-y-1">
              <p><strong className="text-[#dbdee1]">Data Controller:</strong> The Mixing Vault / Tyler Kerpsack All Access</p>
              <p><strong className="text-[#dbdee1]">Privacy Officer:</strong> Connor Brown</p>
              <p><strong className="text-[#dbdee1]">Email:</strong> <a href="mailto:privacy@stemvault.app" className="text-[#5865F2] hover:underline">privacy@stemvault.app</a> or <a href="mailto:connorwbrown07@gmail.com" className="text-[#5865F2] hover:underline">connorwbrown07@gmail.com</a></p>
              <p><strong className="text-[#dbdee1]">Physical Address:</strong> P.O. Box 412, Nashville, TN 37203, United States</p>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="border-t border-[#1f2023] pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#949ba4]">
            <div className="flex items-center gap-3">
              <Link href="/terms" className="hover:text-[#f2f3f5] hover:underline">Terms of Service</Link>
              <span>•</span>
              <Link href="/dmca" className="hover:text-[#f2f3f5] hover:underline">DMCA Policy & Agent</Link>
              <span>•</span>
              <Link href="/unsubscribe" className="hover:text-[#f2f3f5] hover:underline">Email Preferences</Link>
            </div>
            <span>© {new Date().getFullYear()} The Mixing Vault</span>
          </div>
        </div>
      </main>
    </div>
  );
}
