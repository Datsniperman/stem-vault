import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, EyeOff, Lock, FileText, Database, Globe, UserCheck, Key, RefreshCw } from 'lucide-react';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Privacy Policy | The Mixing Vault',
  description: 'Comprehensive Privacy Policy, user rights, data protection disclosures, and content licensing provisions for The Mixing Vault.',
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
              Privacy & Legal Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">The Mixing Vault Privacy Policy</h1>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Effective Date: November 11, 2026. This Privacy Policy governs your access to and use of The Mixing Vault (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or the &quot;Service&quot;), including website services, API endpoints, audio stem storage, and Discord integrations. We are committed to robust privacy protections and full disclosure under US Federal Law, the California Consumer Privacy Act (CCPA/CPRA), the California Invasion of Privacy Act (CIPA), and the European Union General Data Protection Regulation (GDPR).
            </p>
          </div>

          {/* Section 1: Affirmative Disclosure - Zero Session Replay */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">1</span>
              Affirmative Disclosure: Zero Session Replay or Wiretapping
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <EyeOff className="w-4 h-4 shrink-0 text-neutral-400" />
                <span>Zero Invasive Session Recording (California CIPA Compliance)</span>
              </div>
              <p className="text-neutral-300 leading-relaxed">
                The Mixing Vault maintains a strict policy against invasive surveillance technologies. We do <strong className="text-white">NOT deploy session replay software</strong> (such as Hotjar, FullStory, LogRocket, Microsoft Clarity, or Lucky Orange) and do <strong className="text-white">NOT intercept, wiretap, or record keystrokes, cursor tracking, or screen interaction sessions</strong>.
              </p>
              <p className="text-neutral-400 leading-relaxed">
                Aggregated, non-identifying telemetry (such as total page load counts and response latency) is gathered strictly for system reliability and performance monitoring. No audio playback sessions, private communication threads, or personal behavioral patterns are ever wiretapped or shared with external data brokers.
              </p>
            </div>
          </section>

          {/* Section 2: Categories of Information Collected */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">2</span>
              Categories of Information We Collect
            </h2>
            <div className="space-y-3 text-xs text-neutral-400 leading-relaxed">
              <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-3.5 space-y-1">
                <p className="font-semibold text-white">A. Discord Account & Identity Data</p>
                <p>
                  When you authenticate via Discord OAuth 2.0, we receive and store your public Discord User ID, username, global display name, server nickname, avatar URL, verified email address, and guild role affiliations. We do not access, view, or store Discord account passwords or private direct messages.
                </p>
              </div>

              <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-3.5 space-y-1">
                <p className="font-semibold text-white">B. Uploaded Content, Audio & Technical Metadata</p>
                <p>
                  When you upload or share multitrack archives, isolated audio stems, stereo mix entries, DAW session templates, or comments, we process and store the uploaded binary files, original filenames, file formats, duration, size metrics, song key, tempo (BPM), church/artist attribution, and descriptive notes.
                </p>
              </div>

              <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-3.5 space-y-1">
                <p className="font-semibold text-white">C. Network, Security & System Logs</p>
                <p>
                  For infrastructure integrity, abuse prevention, and rate-limiting, our web application firewalls log IP addresses, browser user agents, request headers, and timestamps. These logs are maintained exclusively for security defense, DDoS mitigation, and diagnostic auditing.
                </p>
              </div>

              <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-3.5 space-y-1">
                <p className="font-semibold text-white">D. Billing & Subscription Records</p>
                <p>
                  Subscription transactions (such as Plus and Premium tier memberships) are processed through accredited PCI-DSS compliant payment gateways (such as LaunchPass, Stripe, or Discord). We do not collect or store full credit card numbers or financial account details on our servers.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Legal Bases for Processing (GDPR) */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">3</span>
              Legal Bases for Processing (GDPR Article 6)
            </h2>
            <ul className="list-disc pl-5 text-xs text-neutral-400 space-y-1.5 leading-relaxed">
              <li><strong className="text-white">Contractual Performance:</strong> To maintain your user account, verify membership roles, provide multitrack stem downloads, and process submitted audio mixes.</li>
              <li><strong className="text-white">Legitimate Interests:</strong> To protect platform integrity, safeguard against malicious bots and unauthorized bulk scrapers, and manage community audio competitions.</li>
              <li><strong className="text-white">Legal Obligations:</strong> To comply with applicable tax, corporate accountability, and copyright compliance requirements (including DMCA obligations).</li>
              <li><strong className="text-white">Consent:</strong> Where you have expressly consented to voluntary email notifications, updates, or feature previews.</li>
            </ul>
          </section>

          {/* Section 4: Data Storage, Retention & Security */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">4</span>
              Data Storage, Cloud Infrastructure & Retention
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 text-xs space-y-2 leading-relaxed">
              <p className="text-neutral-300">
                User accounts and database records are housed in secure, isolated PostgreSQL databases. Audio stems, bundled ZIP archives, and uploaded mix entries are distributed and protected across high-durability Cloudflare R2 object storage with Transport Layer Security (TLS 1.3) encryption in transit and AES-256 encryption at rest.
              </p>
              <p className="text-neutral-400">
                Personal information is retained only for as long as your account remains active or as required to fulfill the legitimate business and educational purposes outlined herein, unless a longer retention schedule is mandated by legal, accounting, or regulatory requirements.
              </p>
            </div>
          </section>

          {/* Section 5: Cookies & Local Storage */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">5</span>
              Cookies & Local Storage Disclosures
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We utilize strictly necessary session cookies and browser local storage solely to retain your authenticated session state, preserve audio player playback volume, and register cookie consent preferences. We do <strong className="text-white">NOT use third-party tracking pixels, marketing beacons, or cross-app behavioral tracking cookies</strong>.
            </p>
          </section>

          {/* Section 6: Children's Online Privacy Protection (COPPA) */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">6</span>
              Children&apos;s Online Privacy (Strict 13+ Age Gate)
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 text-xs space-y-2">
              <p className="text-neutral-300 leading-relaxed">
                The Service is strictly restricted to individuals who are at least thirteen (13) years of age (or sixteen in jurisdictions where required by local statute). In accordance with the Children&apos;s Online Privacy Protection Act (COPPA, 15 U.S.C. §§ 6501-6506), we do not knowingly collect, solicit, or maintain personal information from minors under 13.
              </p>
              <p className="text-neutral-400 leading-relaxed">
                If we discover that personal information of a child under 13 has been collected without verified parental authorization, we will expeditiously delete that information and disable the associated account.
              </p>
            </div>
          </section>

          {/* Section 7: User Rights (CCPA/CPRA & GDPR) */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">7</span>
              Your Privacy Rights (GDPR & CCPA/CPRA)
            </h2>
            <div className="space-y-2 text-xs text-neutral-400 leading-relaxed">
              <p>Depending on your location, you possess defined legal rights regarding your personal information:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-white">Right to Access / Know:</strong> Request disclosure of the categories and specific pieces of personal information collected about you.</li>
                <li><strong className="text-white">Right to Erasure / Deletion:</strong> Request the deletion of your personal data and uploaded session records.</li>
                <li><strong className="text-white">Right to Rectification:</strong> Request correction of inaccurate personal data associated with your profile.</li>
                <li><strong className="text-white">Right to Non-Discrimination:</strong> We will not deny goods, charge differing rates, or provide a lower quality of service should you exercise your statutory privacy rights.</li>
                <li><strong className="text-white">Notice of No Sale:</strong> We do not sell personal data, nor do we share personal information for cross-context behavioral advertising.</li>
              </ul>
              <p className="pt-1">
                To exercise these rights, submit a written request to <a href="mailto:privacy@mixingvault.com" className="text-white underline">privacy@mixingvault.com</a>.
              </p>
            </div>
          </section>

          {/* Section 8: Platform Ownership, Executive Discretion & Content Rights */}
          <section className="space-y-3 pt-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">8</span>
              Platform Ownership, Executive Authority & Content Distribution Rights
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800/80 rounded-lg p-4 text-xs text-neutral-400 space-y-3 leading-relaxed">
              <p>
                <strong className="text-neutral-200">Sole Platform Ownership & Executive Authority:</strong> The website, platform, underlying software codebase, architecture, design assets, branding, and related services are the sole and exclusive proprietary property of the site owner and operator. The site owner retains full, absolute, and unreviewable executive authority and discretion over all operational, administrative, editorial, membership, and content decisions. This includes the unilateral right to approve, reject, reclassify, modify, feature, restrict, or remove any content, multitrack, mix, plugin chain, or user account at any time and for any reason without prior notice or liability.
              </p>
              <p>
                <strong className="text-neutral-200">User Content Submission & License Grant:</strong> By submitting, uploading, transmitting, or otherwise publishing any multitrack session files, audio stems, stereo mix recordings, project templates, plugin chains, stems, artwork, audio files, descriptions, or comments to or through the platform, you represent and warrant that you possess all requisite rights and authorizations to do so. You hereby grant to the site owner, operator, and their affiliates, successors, and assigns a perpetual, irrevocable, worldwide, royalty-free, fully paid-up, transferable, sublicensable, and non-exclusive license to host, cache, store, copy, reproduce, adapt, reformat, distribute, publish, publicly display, publicly perform, create derivative works from, monetize, commercialize, and exploit such uploaded content in any and all formats, platforms, and distribution channels now known or hereafter developed.
              </p>
              <p>
                <strong className="text-neutral-200">Commercialization & Distribution Permissions:</strong> The site owner and operator maintain the unrestricted right and permission to distribute, package, monetize, license, and commercialize all uploaded and platform-hosted assets, sessions, and materials across educational courses, premium tiers, competitions, promotional campaigns, and subscription services, without any obligation for compensation, accounting, attribution, or royalty payments to the uploader.
              </p>
            </div>
          </section>

          {/* Section 9: Official Contact & Legal Inquiries */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">9</span>
              Contact Information & Communications
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 text-xs text-neutral-400 space-y-1 font-mono">
              <p><strong className="text-white">Platform Owner & Operator:</strong> The Mixing Vault / Tyler Kerpsack All Access</p>
              <p><strong className="text-white">Lead Administrator:</strong> Connor Brown</p>
              <p><strong className="text-white">Privacy Inquiries:</strong> <a href="mailto:privacy@mixingvault.com" className="text-white underline">privacy@mixingvault.com</a></p>
              <p><strong className="text-white">Support Inquiries:</strong> <a href="mailto:support@mixingvault.com" className="text-white underline">support@mixingvault.com</a></p>
              <p><strong className="text-white">Mailing Address:</strong> P.O. Box 412, Nashville, TN 37203, United States</p>
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
            <span>© {new Date().getFullYear()} The Mixing Vault. All rights reserved.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
