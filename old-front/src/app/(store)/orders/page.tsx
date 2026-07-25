import type { Metadata } from 'next';
import OrdersPage from '@/features/orders/OrdersPage';

export const metadata: Metadata = {
  title: 'Buyurtmalarim',
  robots: { index: false },
};

export default function Page() {
  return <OrdersPage />;
}
