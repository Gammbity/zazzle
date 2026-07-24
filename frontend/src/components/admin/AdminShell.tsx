'use client';

import AdminGuard from './AdminGuard';
import AdminLayout from './AdminLayout';
import { AdminBaseProvider } from './AdminBaseContext';

interface AdminShellProps {
  base: string;
  slug: string | null;
  children: React.ReactNode;
}

export default function AdminShell({ base, slug, children }: AdminShellProps) {
  return (
    <AdminBaseProvider base={base} slug={slug}>
      <AdminGuard>
        <AdminLayout>{children}</AdminLayout>
      </AdminGuard>
    </AdminBaseProvider>
  );
}
