import type { Metadata } from 'next';
import CartPage from '@/features/cart/CartPage';

export const metadata: Metadata = {
  title: 'Savatcha',
  robots: { index: false },
};

export default function Page() {
  return <CartPage />;
}
