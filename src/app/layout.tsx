import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { Analytics } from '@vercel/analytics/next';
import { Footer } from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Mixing Vault',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mixingvault.com'),
  openGraph: {
    title: 'The Mixing Vault',
    type: 'website',
    siteName: 'The Mixing Vault',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Mixing Vault',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased bg-[#09090b] text-neutral-200 selection:bg-neutral-800 selection:text-white min-h-screen flex flex-col">
        <AuthProvider>
          <ToastProvider>
            <div className="flex-1 flex flex-col w-full">
              {children}
            </div>
            <Footer />
            <Analytics />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
