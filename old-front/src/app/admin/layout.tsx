import type { Metadata } from 'next';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: { default: 'Admin panel', template: '%s | Zazzle Admin' },
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell base='/admin' slug={null}>
      {children}
    </AdminShell>
  );
}
