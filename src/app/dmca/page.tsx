import Link from 'next/link';
import { Shield, ArrowLeft, Mail, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'DMCA & Copyright Policy | The Mixing Vault',
  description: 'Digital Millennium Copyright Act (DMCA) Notice, Designated Copyright Agent, and Repeat Infringer Policy for The Mixing Vault.',
};

export default function DmcaPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex flex-col font-sans">
      <Header />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to multitracks</span>
        </Link>

        {/* Page Title Card */}
        <div className="bg-[#121212] border border-neutral-800 rounded-lg p-6 sm:p-8 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-neutral-200" />
            <h1 className="text-xl sm:text-2xl font-semibold text-white">
              DMCA & Copyright Policy
            </h1>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The Mixing Vault respects the intellectual property rights of artists, publishers, and producers.
            In accordance with the Digital Millennium Copyright Act (17 U.S.C. § 512, &quot;DMCA&quot;), we respond expeditiously to notices of alleged copyright infringement.
          </p>
        </div>

        {/* Policy Content */}
        <div className="bg-[#121212] border border-neutral-800 rounded-lg p-6 sm:p-8 space-y-6 text-xs text-neutral-300 leading-relaxed">
          
          {/* Section 1: Designated Agent */}
          <section className="space-y-2.5">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-neutral-400" />
              <span>1. Designated Copyright Agent Contact Information</span>
            </h2>
            <p className="text-neutral-400">
              Notifications of claimed infringement must be submitted in writing to our Designated DMCA Copyright Agent:
            </p>
            <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4 space-y-1.5 font-mono text-xs">
              <p><strong className="text-white">Designated Agent:</strong> Connor Brown / Legal Compliance Officer</p>
              <p><strong className="text-white">Platform / Entity:</strong> The Mixing Vault (Tyler Kerpsack All Access)</p>
              <p><strong className="text-white">Email:</strong> <a href="mailto:connorwbrown07@gmail.com" className="text-white hover:underline underline">connorwbrown07@gmail.com</a></p>
              <p><strong className="text-white">Alternate Contact:</strong> <a href="mailto:dmca@stemvault.app" className="text-white hover:underline underline">dmca@stemvault.app</a></p>
              <p><strong className="text-white">Mailing Address:</strong> Attn: DMCA Copyright Agent, P.O. Box 412, Nashville, TN 37203, USA</p>
              <p><strong className="text-white">Phone:</strong> (615) 852-5793</p>
            </div>
            <p className="text-[11px] text-neutral-400">
              <em>Note:</em> The Designated Agent information above is registered with the United States Copyright Office Directory of Service Provider Agents pursuant to 17 U.S.C. § 512(c)(2).
            </p>
          </section>

          {/* Section 2: How to Submit a Notice */}
          <section className="space-y-2.5">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-neutral-400" />
              <span>2. Required Elements of a Valid Takedown Notice</span>
            </h2>
            <p className="text-neutral-400">
              To ensure compliance with 17 U.S.C. § 512(c)(3), your notification of claimed infringement must include all of the following elements:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-neutral-400">
              <li>
                <strong className="text-neutral-200">Physical or Electronic Signature:</strong> A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
              </li>
              <li>
                <strong className="text-neutral-200">Identification of the Work:</strong> Identification of the copyrighted work claimed to have been infringed (or, if multiple works at a single site are covered by a single notification, a representative list).
              </li>
              <li>
                <strong className="text-neutral-200">Identification of Infringing Material:</strong> Identification of the material claimed to be infringing or to be the subject of infringing activity, and information reasonably sufficient to permit us to locate the material (specifically, the URL of the multitrack session in The Mixing Vault).
              </li>
              <li>
                <strong className="text-neutral-200">Contact Information:</strong> Information reasonably sufficient to permit us to contact you, such as your full legal name, physical address, telephone number, and email address.
              </li>
              <li>
                <strong className="text-neutral-200">Good Faith Statement:</strong> A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
              </li>
              <li>
                <strong className="text-neutral-200">Perjury & Accuracy Statement:</strong> A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
              </li>
            </ol>
          </section>

          {/* Section 3: Safe Harbor & Expedited Takedown */}
          <section className="space-y-2.5">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-neutral-300" />
              <span>3. Takedown Procedure & Expeditious Removal</span>
            </h2>
            <p className="text-neutral-400">
              The Mixing Vault does not directly host multi-gigabyte audio binary files; rather, it functions as an indexed exchange linking to user-provided external storage (e.g., Google Drive, Dropbox, Box, OneDrive).
            </p>
            <p className="text-neutral-400">
              Upon receipt of a legally compliant notification satisfying § 512(c)(3), The Mixing Vault will expeditiously remove or disable access to the contested listing, delete associated links from our db, and notify the user who submitted the session.
            </p>
          </section>

          {/* Section 4: Counter-Notification Procedure */}
          <section className="space-y-2.5">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-neutral-400" />
              <span>4. Counter-Notification Procedure (17 U.S.C. § 512(g))</span>
            </h2>
            <p className="text-neutral-400">
              If a user believes that material they uploaded was removed or disabled as a result of mistake or misidentification, they may file a written Counter-Notification with our Designated Agent containing:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-400">
              <li>The user&apos;s physical or electronic signature;</li>
              <li>Identification of the material that was removed and the location where it appeared before removal;</li>
              <li>A statement under penalty of perjury that the user has a good faith belief that the material was removed or disabled as a result of mistake or misidentification;</li>
              <li>The user&apos;s name, address, and telephone number, and consent to the jurisdiction of the Federal District Court for the judicial district in which their address is located.</li>
            </ul>
          </section>

          {/* Section 5: Repeat Infringer Policy */}
          <section className="space-y-2.5 bg-[#0d0d0e] border border-neutral-800 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              5. Repeat Infringer Termination Policy
            </h2>
            <p className="text-neutral-300">
              In accordance with Section 512(i)(1)(A) of the DMCA, The Mixing Vault maintains and enforces a strict repeat infringer policy:
            </p>
            <p className="text-neutral-400">
              Any member or user account that is the subject of multiple verified infringement notices or who repeatedly uploads links to copyrighted materials without authorization will have their account immediately suspended and permanently banned from The Mixing Vault platform and the associated Tyler Kerpsack All Access Discord server.
            </p>
          </section>

          {/* Section 6: Misrepresentation Liability */}
          <section className="space-y-1.5 text-neutral-400 text-[11px] pt-2 border-t border-neutral-800">
            <p>
              <strong>Warning on False Claims:</strong> Under 17 U.S.C. § 512(f), any person who knowingly materially misrepresents that material or activity is infringing, or that material or activity was removed or disabled by mistake or misidentification, shall be liable for damages, including costs and attorneys&apos; fees, incurred by the alleged infringer, copyright owner, or service provider.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-[#0a0a0a] py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <span>© {new Date().getFullYear()} The Mixing Vault • Tyler Kerpsack All Access</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/dmca" className="text-white hover:underline font-semibold">DMCA Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
