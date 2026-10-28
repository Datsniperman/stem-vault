import Link from 'next/link';
import { ShieldAlert, ExternalLink, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Access Required | The Mixing Vault',
};

export default function UnauthorizedPage() {
  const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg';

  return (
    <main className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-[#313338]">
      <div className="max-w-md w-full bg-[#2b2d31] border border-[#1f2023] rounded-lg p-6 sm:p-8 text-center shadow-xl">
        <div className="w-12 h-12 rounded-full bg-[#f23f43]/15 border border-[#f23f43]/30 flex items-center justify-center mx-auto mb-4 text-[#f23f43]">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-bold text-[#f2f3f5]">
          Discord Server Access Required
        </h1>

        <p className="mt-2 text-[#949ba4] text-xs leading-relaxed">
          The Mixing Vault is exclusive to members of the <strong className="text-[#f2f3f5]">Tyler Kerpsack All Access</strong> Discord server.
        </p>

        <p className="mt-1.5 text-[#80848e] text-xs leading-relaxed">
          We could not find your Discord account in our server. Please join the Discord first, then log in again.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-2 px-4 rounded transition-colors text-xs shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Join All Access Discord
          </a>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-[#1e1f22] hover:bg-[#35373c] text-[#dbdee1] py-2 px-4 rounded transition-colors text-xs border border-[#1f2023]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
