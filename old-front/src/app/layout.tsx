import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  title: {
    default: 'Zazzle Uzbekistan — Dizayn va bosma platformasi',
    template: '%s | Zazzle Uzbekistan',
  },
  description:
    'Rasm yuklang, mahsulotingizni dizayn qiling va O‘zbekiston bo‘ylab buyurtma bering.',
  applicationName: 'Zazzle Uzbekistan',
  authors: [{ name: 'Zazzle Uzbekistan' }],
  keywords: [
    'custom print',
    'futbolka dizayni',
    'krujka',
    'sovg‘a',
    'Uzbekistan',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    siteName: 'Zazzle Uzbekistan',
    title: 'Zazzle Uzbekistan — O‘zingizga mos mahsulot yarating',
    description:
      'Rasm yuklang va mahsulotingizda jonli ko‘rinishini darhol ko‘ring.',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fbf9f8',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='uz' data-scroll-behavior='smooth' suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
