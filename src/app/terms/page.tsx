import Link from 'next/link';
import { ArrowLeft, Shield, AlertTriangle, Scale, RefreshCw } from 'lucide-react';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Terms of Service | The Mixing Vault',
  description: 'Terms of Service, community rules, and legal agreements for The Mixing Vault.',
};

export default function TermsOfServicePage() {
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
              Legal Agreement & Binding Terms
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">The Mixing Vault Terms of Service</h1>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Please read these Terms of Service (&quot;Terms&quot;) carefully before using The Mixing Vault website and Discord integration services (&quot;Service&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), operated in association with the Tyler Kerpsack All Access Community. By accessing or using the Service, you agree to be bound by these Terms.
            </p>
          </div>

          {/* Section 1: Age Gate */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">1</span>
              Eligibility & Mandatory Age Gate (13+ Requirement)
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-neutral-400" />
                <span>Strict Minimum Age Requirement (COPPA & GDPR Compliance)</span>
              </div>
              <p className="leading-relaxed text-neutral-400">
                You must be at least <strong className="text-white">thirteen (13) years of age</strong> (or sixteen (16) years of age where required by European Union member state law under the GDPR) to access, register for, or use this Service.
              </p>
              <p className="leading-relaxed text-neutral-400">
                The Service is not directed to children under 13. We do not knowingly collect or solicit personal information from children under 13 in strict accordance with the Children&apos;s Online Privacy Protection Act (COPPA, 15 U.S.C. §§ 6501–6506). If we learn that we have collected personal data from a child under 13 without verified parental consent, we will delete that information immediately and terminate the corresponding account.
              </p>
            </div>
          </section>

          {/* Section 2: User Accounts & Discord Integration */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">2</span>
              User Accounts & Discord Community Integration
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Access to multitrack sessions, mix submission showcase, and peer critiques requires an active Discord account linked to the Tyler Kerpsack All Access Discord guild. When connecting via Discord OAuth:
            </p>
            <ul className="list-disc pl-5 text-xs text-neutral-400 space-y-1.5 leading-relaxed">
              <li>You agree to keep your Discord authentication credentials secure.</li>
              <li>Your public server display name and guild avatar will be synchronized with your profile to facilitate transparent community interactions.</li>
              <li>You are solely responsible for all activities and content published under your account.</li>
            </ul>
          </section>

          {/* Section 3: User Content, Copyright & Indemnification */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">3</span>
              User Submissions, Educational Use & Copyright Warranties
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 text-xs space-y-3">
              <p className="text-neutral-300 leading-relaxed">
                The Mixing Vault is an educational, non-commercial peer-mixing practice exchange. Every user submitting multitrack stems, audio mixes, or DAW templates represents and warrants that:
              </p>
              <ol className="list-decimal pl-5 text-neutral-400 space-y-1.5 leading-relaxed">
                <li>
                  <strong className="text-white">Authorization & Rights:</strong> You own the copyrights or possess valid licenses, permissions, or authorizations to share the multitrack audio stems or mix files for community educational practice.
                </li>
                <li>
                  <strong className="text-white">No Commercial Exploitation:</strong> Audio stems, templates, and mix submissions made available through this platform may <span className="underline">NOT</span> be resold, repackaged, commercially redistributed, or submitted to digital streaming platforms (DSP) without express written consent from the original rights holder.
                </li>
                <li>
                  <strong className="text-white">Third-Party Hosting:</strong> Audio stems and mix files are hosted on third-party cloud storage (e.g., Google Drive, Dropbox, Box) provided by users. The Service does not sell or maintain primary ownership of these files.
                </li>
                <li>
                  <strong className="text-white">Hold Harmless & Indemnification:</strong> You agree to defend, indemnify, and hold harmless The Mixing Vault, Tyler Kerpsack All Access, its administrators, and affiliates from and against any third-party claims, liabilities, damages, and expenses (including legal fees) arising from any audio or material submitted by you that infringes any copyright or intellectual property right.
                </li>
              </ol>
            </div>
            <p className="text-xs text-neutral-400">
              For copyright infringement notifications or DMCA takedown requests, see our dedicated <Link href="/dmca" className="text-white underline hover:text-neutral-300">DMCA Policy & Agent Page</Link>.
            </p>
          </section>

          {/* Section 4: Subscriptions, Renewals & ROSCA / California ARL Disclosures */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">4</span>
              Subscriptions, Renewal Terms & Cancellation (FTC ROSCA / California ARL)
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 text-xs space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <RefreshCw className="w-4 h-4 text-neutral-400" />
                <span>Automatic Renewal & Billing Terms</span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                The core web vault functions as a community service for members. In the event that you purchase any paid tier, community membership, or recurring subscription associated with Tyler Kerpsack All Access, the following terms govern under the Restore Online Shoppers&apos; Confidence Act (ROSCA, 15 U.S.C. §§ 8401–8405) and California Automatic Renewal Law (Cal. Bus. &amp; Prof. Code §§ 17600–17606):
              </p>
              <ul className="list-disc pl-5 text-neutral-400 space-y-1.5 leading-relaxed">
                <li>
                  <strong className="text-white">Automatic Renewal:</strong> Any recurring subscription plan automatically renews at the end of each billing cycle (e.g., monthly or annually) at the then-current subscription fee unless you cancel before the renewal date.
                </li>
                <li>
                  <strong className="text-white">Visual Disclosure:</strong> Pricing, billing frequency, and automatic renewal terms will always be clearly and conspicuously displayed in close visual proximity to the checkout or subscription button prior to payment completion.
                </li>
                <li>
                  <strong className="text-white">Click-to-Cancel (Simple Online Cancellation):</strong> You may cancel your subscription at any time online through your account billing settings or Discord server subscription management with no hidden hurdles or cancellation fees. Upon cancellation, your access will continue until the end of the current paid billing period.
                </li>
                <li>
                  <strong className="text-white">Notice of Material Changes:</strong> If the price or terms of a recurring subscription change, you will receive written advance notice and an affirmative opportunity to accept or cancel prior to being charged.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5: Disclaimer of Warranties & Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">5</span>
              Disclaimer of Warranties & Limitation of Liability
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 text-xs text-neutral-400 space-y-2 leading-relaxed">
              <p className="uppercase text-[11px] font-mono font-bold text-neutral-200">Provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;</p>
              <p>
                THE SERVICE, INCLUDING ALL MULTITRACKS, MIXES, SOFTWARE, AND DISCORD INTEGRATIONS, IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                IN NO EVENT SHALL THE MIXING VAULT, TYLER KERPSACK, OPERATORS, OR CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE OR DOWNLOADED FILES.
              </p>
            </div>
          </section>

          {/* Section 6: Contact Information */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center text-xs font-mono">6</span>
              Contact & Inquiries
            </h2>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 text-xs text-neutral-400 space-y-1 font-mono">
              <p><strong className="text-white">Operator:</strong> Tyler Kerpsack All Access / The Mixing Vault</p>
              <p><strong className="text-white">Email:</strong> <a href="mailto:support@stemvault.app" className="text-white underline">support@stemvault.app</a> or <a href="mailto:connorwbrown07@gmail.com" className="text-white underline">connorwbrown07@gmail.com</a></p>
              <p><strong className="text-white">Physical Address:</strong> P.O. Box 412, Nashville, TN 37203, United States</p>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="border-t border-neutral-800 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
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
