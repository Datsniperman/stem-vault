import Link from 'next/link';
import { ArrowLeft, Shield, AlertTriangle, Scale, Lock, DollarSign, RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service, community rules, and legal agreements for The Mixing Vault.',
};

export default function TermsOfServicePage() {
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
            <Scale className="w-4 h-4 text-[#5865F2]" />
            <h1 className="text-sm font-bold text-[#f2f3f5]">Terms of Service</h1>
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
              Legal Agreement & Binding Terms
            </div>
            <h2 className="text-2xl font-bold text-[#f2f3f5]">The Mixing Vault Terms of Service</h2>
            <p className="text-xs text-[#949ba4] mt-2 leading-relaxed">
              Please read these Terms of Service (&quot;Terms&quot;) carefully before using The Mixing Vault website and Discord integration services (&quot;Service&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), operated in association with the Tyler Kerpsack All Access Community. By accessing or using the Service, you agree to be bound by these Terms.
            </p>
          </div>

          {/* Section 1: Age Gate */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f2f3f5] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1e1f22] text-[#5865F2] flex items-center justify-center text-xs">1</span>
              Eligibility & Mandatory Age Gate (13+ Requirement)
            </h3>
            <div className="bg-[#1e1f22] border border-[#f23f43]/30 rounded p-4 text-xs text-[#dbdee1] space-y-2">
              <div className="flex items-center gap-2 text-[#f23f43] font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Strict Minimum Age Requirement (COPPA & GDPR Compliance)</span>
              </div>
              <p className="leading-relaxed text-[#949ba4]">
                You must be at least <strong className="text-[#f2f3f5]">thirteen (13) years of age</strong> (or sixteen (16) years of age where required by European Union member state law under the GDPR) to access, register for, or use this Service.
              </p>
              <p className="leading-relaxed text-[#949ba4]">
                The Service is not directed to children under 13. We do not knowingly collect or solicit personal information from children under 13 in strict accordance with the Children&apos;s Online Privacy Protection Act (COPPA, 15 U.S.C. §§ 6501–6506). If we learn that we have collected personal data from a child under 13 without verified parental consent, we will delete that information immediately and terminate the corresponding account.
              </p>
            </div>
          </section>

          {/* Section 2: User Accounts & Discord Integration */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f2f3f5] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1e1f22] text-[#5865F2] flex items-center justify-center text-xs">2</span>
              User Accounts & Discord Community Integration
            </h3>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              Access to multitrack sessions, mix submission showcase, and peer critiques requires an active Discord account linked to the Tyler Kerpsack All Access Discord guild. When connecting via Discord OAuth:
            </p>
            <ul className="list-disc pl-5 text-xs text-[#949ba4] space-y-1.5 leading-relaxed">
              <li>You agree to keep your Discord authentication credentials secure.</li>
              <li>Your public server display name and guild avatar will be synchronized with your profile to facilitate transparent community interactions.</li>
              <li>You are solely responsible for all activities and content published under your account.</li>
            </ul>
          </section>

          {/* Section 3: User Content, Copyright & Indemnification */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f2f3f5] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1e1f22] text-[#5865F2] flex items-center justify-center text-xs">3</span>
              User Submissions, Educational Use & Copyright Warranties
            </h3>
            <div className="bg-[#1e1f22] border border-[#1f2023] rounded p-4 text-xs space-y-3">
              <p className="text-[#dbdee1] leading-relaxed">
                The Mixing Vault is an educational, non-commercial peer-mixing practice exchange. Every user submitting multitrack stems, audio mixes, or DAW templates represents and warrants that:
              </p>
              <ol className="list-decimal pl-5 text-[#949ba4] space-y-1.5 leading-relaxed">
                <li>
                  <strong className="text-[#f2f3f5]">Authorization & Rights:</strong> You own the copyrights or possess valid licenses, permissions, or authorizations to share the multitrack audio stems or mix files for community educational practice.
                </li>
                <li>
                  <strong className="text-[#f2f3f5]">No Commercial Exploitation:</strong> Audio stems, templates, and mix submissions made available through this platform may <span className="underline">NOT</span> be resold, repackaged, commercially redistributed, or submitted to digital streaming platforms (DSP) without express written consent from the original rights holder.
                </li>
                <li>
                  <strong className="text-[#f2f3f5]">Third-Party Hosting:</strong> Audio stems and mix files are hosted on third-party cloud storage (e.g., Google Drive, Dropbox, Box) provided by users. The Service does not sell or maintain primary ownership of these files.
                </li>
                <li>
                  <strong className="text-[#f2f3f5]">Hold Harmless & Indemnification:</strong> You agree to defend, indemnify, and hold harmless The Mixing Vault, Tyler Kerpsack All Access, its administrators, and affiliates from and against any third-party claims, liabilities, damages, and expenses (including legal fees) arising from any audio or material submitted by you that infringes any copyright or intellectual property right.
                </li>
              </ol>
            </div>
            <p className="text-xs text-[#949ba4]">
              For copyright infringement notifications or DMCA takedown requests, see our dedicated <Link href="/dmca" className="text-[#5865F2] hover:underline">DMCA Policy & Agent Page</Link>.
            </p>
          </section>

          {/* Section 4: Subscriptions, Renewals & ROSCA / California ARL Disclosures */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f2f3f5] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1e1f22] text-[#5865F2] flex items-center justify-center text-xs">4</span>
              Subscriptions, Renewal Terms & Cancellation (FTC ROSCA / California ARL)
            </h3>
            <div className="bg-[#1e1f22] border border-[#1f2023] rounded p-4 text-xs space-y-3">
              <div className="flex items-center gap-2 text-[#5865F2] font-semibold">
                <RefreshCw className="w-4 h-4" />
                <span>Automatic Renewal & Billing Terms</span>
              </div>
              <p className="text-[#949ba4] leading-relaxed">
                The core web vault functions as a community service for members. In the event that you purchase any paid tier, community membership, or recurring subscription associated with Tyler Kerpsack All Access, the following terms govern under the Restore Online Shoppers&apos; Confidence Act (ROSCA, 15 U.S.C. §§ 8401–8405) and California Automatic Renewal Law (Cal. Bus. &amp; Prof. Code §§ 17600–17606):
              </p>
              <ul className="list-disc pl-5 text-[#949ba4] space-y-1.5 leading-relaxed">
                <li>
                  <strong className="text-[#f2f3f5]">Automatic Renewal:</strong> Any recurring subscription plan automatically renews at the end of each billing cycle (e.g., monthly or annually) at the then-current subscription fee unless you cancel before the renewal date.
                </li>
                <li>
                  <strong className="text-[#f2f3f5]">Visual Disclosure:</strong> Pricing, billing frequency, and automatic renewal terms will always be clearly and conspicuously displayed in close visual proximity to the checkout or subscription button prior to payment completion.
                </li>
                <li>
                  <strong className="text-[#f2f3f5]">Click-to-Cancel (Simple Online Cancellation):</strong> You may cancel your subscription at any time online through your account billing settings or Discord server subscription management with no hidden hurdles or cancellation fees. Upon cancellation, your access will continue until the end of the current paid billing period.
                </li>
                <li>
                  <strong className="text-[#f2f3f5]">Notice of Material Changes:</strong> If the price or terms of a recurring subscription change, you will receive written advance notice and an affirmative opportunity to accept or cancel prior to being charged.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5: Disclaimer of Warranties & Limitation of Liability */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f2f3f5] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1e1f22] text-[#5865F2] flex items-center justify-center text-xs">5</span>
              Disclaimer of Warranties & Limitation of Liability
            </h3>
            <div className="bg-[#1e1f22] border border-[#1f2023] rounded p-4 text-xs text-[#949ba4] space-y-2 leading-relaxed">
              <p className="uppercase text-[11px] font-bold text-[#dbdee1]">Provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;</p>
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#f2f3f5] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1e1f22] text-[#5865F2] flex items-center justify-center text-xs">6</span>
              Contact & Inquiries
            </h3>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              If you have questions regarding these Terms of Service, please reach out through our official channels:
            </p>
            <div className="bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-xs text-[#949ba4] space-y-1">
              <p><strong className="text-[#dbdee1]">Operator:</strong> Tyler Kerpsack All Access / The Mixing Vault</p>
              <p><strong className="text-[#dbdee1]">Email:</strong> <a href="mailto:support@stemvault.app" className="text-[#5865F2] hover:underline">support@stemvault.app</a> or <a href="mailto:connorwbrown07@gmail.com" className="text-[#5865F2] hover:underline">connorwbrown07@gmail.com</a></p>
              <p><strong className="text-[#dbdee1]">Physical Address:</strong> P.O. Box 412, Nashville, TN 37203, United States</p>
              <p><strong className="text-[#dbdee1]">Discord:</strong> Tyler Kerpsack All Access Community Server</p>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="border-t border-[#1f2023] pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#949ba4]">
            <div className="flex items-center gap-3">
              <Link href="/privacy" className="hover:text-[#f2f3f5] hover:underline">Privacy Policy</Link>
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
