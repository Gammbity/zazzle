import type { Metadata } from 'next';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: { default: 'Admin panel', template: '%s | Zazzle Admin' },
  robots: { index: false },
};

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ center: string }>;
}) {
  const { center } = await params;
  return (
    <AdminShell base={`/${center}/admin`} slug={center}>
      {children}
    </AdminShell>
  );
}
