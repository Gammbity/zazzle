import type { Metadata } from 'next';
import CheckoutPage from '@/features/checkout/CheckoutPage';

export const metadata: Metadata = {
  title: 'Buyurtmani rasmiylashtirish',
  robots: { index: false },
};

export default function Page() {
  return <CheckoutPage />;
}
