import type { Metadata } from 'next';
import { Playfair_Display, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { Analytics } from '@vercel/analytics/next';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'The Mixing Vault — Tyler Kerpsack All Access',
    template: '%s | The Mixing Vault',
  },
  description:
    'Exclusive in-house multitrack session archive & mix critique hub for Tyler Kerpsack All Access. Powered by KerpBot.',
  metadataBase: new URL('https://stem-vault-tau.vercel.app'),
  openGraph: {
    title: 'The Mixing Vault — Tyler Kerpsack All Access',
    description: 'In-house multitrack session archive & mix critique hub powered by KerpBot.',
    type: 'website',
    siteName: 'The Mixing Vault',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Mixing Vault — Tyler Kerpsack All Access',
    description: 'In-house multitrack session archive & mix critique hub powered by KerpBot.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${spaceGrotesk.variable}`}
    >
      <body className="font-body antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
            <Analytics />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

