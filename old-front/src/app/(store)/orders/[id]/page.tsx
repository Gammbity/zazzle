import type { Metadata } from 'next';
import OrderDetailPage from '@/features/orders/OrderDetailPage';

export const metadata: Metadata = {
  title: 'Buyurtma tafsilotlari',
  robots: { index: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailPage orderLookup={id} />;
}
