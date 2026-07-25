import AdminProductDetailPage from '@/features/admin/AdminProductDetailPage';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminProductDetailPage productId={id} />;
}
