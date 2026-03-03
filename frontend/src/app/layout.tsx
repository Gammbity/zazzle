import { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'),
  title: 'Zazzle Uzbekistan - Custom Print on Demand',
  description: 'Create custom designs and print them on high-quality products. T-shirts, mugs, posters and more. Made in Uzbekistan.',
  keywords: 'print on demand, custom designs, t-shirts, mugs, posters, Uzbekistan',
  authors: [{ name: 'Zazzle Uzbekistan' }],
  creator: 'Zazzle Uzbekistan',
  publisher: 'Zazzle Uzbekistan',
  robots: 'index, follow',
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
    <html lang='en'>
      <body className='font-sans antialiased'>
        {children}
      </body>
    </html>
  );
}