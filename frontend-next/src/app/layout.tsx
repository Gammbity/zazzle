import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://zazzle.uz'),
  title: {
    default: 'Zazzle.uz — O‘z dizayningiz bilan har qanday mahsulot',
    template: '%s | Zazzle.uz',
  },
  description:
    'O‘zbekistondagi print-on-demand platforma. Krujka, ruchka, futbolka va boshqalar uchun o‘z dizayningiz bilan buyurtma bering.',
  keywords: ['krujka chop etish', 'futbolka chop etish', 'vizitka buyurtma', 'O‘zbekiston', 'print on demand', 'sovg‘a'],
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    siteName: 'Zazzle.uz',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
