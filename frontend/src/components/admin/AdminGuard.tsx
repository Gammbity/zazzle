import { useEffect, type ReactNode } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useCurrentUser, useIsAdmin, useIsSuperAdmin } from '@/hooks/queries';
import { isAuthenticated } from '@/lib/commerce';
import { navigate } from '@/lib/router';
import AdminLoginGate from '@/components/admin/AdminLoginGate';
import { useAdminBase } from '@/components/admin/AdminBaseContext';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();
  const authed = isAuthenticated();
  // useIsAdmin() covers is_staff and any manager — page/nav-level checks
  // further narrow what a scoped manager actually sees inside the shell.
  const canEnterAdminPanel = useIsAdmin();
  const isSuperAdmin = useIsSuperAdmin();
  const authorized = authed && canEnterAdminPanel;

  const { slug } = useAdminBase();
  // A per-partner URL (/<slug>/admin) only opens for that partner's own
  // staff — a super admin can still use any partner's URL to look in.
  const slugMismatch = Boolean(
    slug && authorized && !isSuperAdmin && user?.production_center_slug !== slug
  );

  useEffect(() => {
    if (isLoading) return;
    // Logged in but without admin/manager access — no login form can fix
    // that, so bounce home instead of looping back to the same form.
    if (authed && !canEnterAdminPanel) {
      navigate('/', { replace: true });
    }
  }, [isLoading, authed, canEnterAdminPanel]);

  if (!authed) {
    return <AdminLoginGate />;
  }

  if (isLoading || !authorized) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-brand-bg'>
        <Loader2 className='h-6 w-6 animate-spin text-amber-600' />
      </div>
    );
  }

  if (slugMismatch) {
    const ownPath = user?.production_center_slug
      ? `/${user.production_center_slug}/admin`
      : '/';
    return (
      <div className='flex min-h-screen items-center justify-center bg-brand-bg px-4'>
        <div className='w-full max-w-sm rounded-[1.75rem] border border-stone-200 bg-white p-8 text-center shadow-xl shadow-amber-100/40'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600'>
            <ShieldAlert className='h-6 w-6' />
          </div>
          <h1 className='mt-4 text-lg font-semibold text-slate-900'>
            Bu admin panel sizga tegishli emas
          </h1>
          <p className='mt-2 text-sm text-slate-500'>
            Bu hisob boshqa ishlab chiqarish markaziga biriktirilgan.
          </p>
          <button
            type='button'
            onClick={() => navigate(ownPath, { replace: true })}
            className='mt-6 w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
          >
            O&apos;z panelimga o&apos;tish
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
