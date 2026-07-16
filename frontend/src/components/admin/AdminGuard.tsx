import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useCurrentUser, useIsAdmin } from '@/hooks/queries';
import { isAuthenticated } from '@/lib/commerce';
import { navigate } from '@/lib/router';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { isLoading } = useCurrentUser();
  const authed = isAuthenticated();
  // useIsAdmin() covers is_staff and any manager — page/nav-level checks
  // further narrow what a scoped manager actually sees inside the shell.
  const canEnterAdminPanel = useIsAdmin();
  const authorized = authed && canEnterAdminPanel;

  useEffect(() => {
    if (isLoading) return;
    if (!authorized) {
      navigate('/', { replace: true });
    }
  }, [authorized, isLoading]);

  if (isLoading || !authorized) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-brand-bg'>
        <Loader2 className='h-6 w-6 animate-spin text-amber-600' />
      </div>
    );
  }

  return <>{children}</>;
}
