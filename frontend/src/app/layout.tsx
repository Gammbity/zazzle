import { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Suspense } from 'react';
import NavigationProgress from '@/components/NavigationProgress';
import './globals.css';

// Optimized font loading with preload
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'),
  title: {
    default: 'Zazzle Uzbekistan - Custom Print on Demand',
    template: '%s | Zazzle Uzbekistan',
  },
  description: 'Create custom designs and print them on high-quality products. T-shirts, mugs, posters and more. Made in Uzbekistan.',
  keywords: ['print on demand', 'custom designs', 't-shirts', 'mugs', 'posters', 'Uzbekistan', 'custom printing'],
  authors: [{ name: 'Zazzle Uzbekistan' }],
  creator: 'Zazzle Uzbekistan',
  publisher: 'Zazzle Uzbekistan',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://zazzle.uz',
    title: 'Zazzle Uzbekistan - Custom Print on Demand',
    description: 'Create custom designs and print them on high-quality products.',
    siteName: 'Zazzle Uzbekistan',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zazzle Uzbekistan - Custom Print on Demand',
    description: 'Create custom designs and print them on high-quality products.',
    creator: '@zazzle_uz',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      </head>
      <body className='font-sans antialiased'>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}