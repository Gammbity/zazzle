import type { ComponentType, ReactNode } from 'react';
import {
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  ClipboardList,
  Store,
  Users,
} from 'lucide-react';
import { Link, useLocation } from '@/lib/router';
import {
  useCanManageOrders,
  useCanManagePickupLocations,
  useCanManageProducts,
  useCurrentUser,
  useIsTrueAdmin,
  useLogout,
} from '@/hooks/queries';
import { cn } from '@/lib/utils';

interface NavLink {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact: boolean;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const canManageOrders = useCanManageOrders();
  const canManageProducts = useCanManageProducts();
  const canManagePickupLocations = useCanManagePickupLocations();
  const isTrueAdmin = useIsTrueAdmin();

  const navLinks: NavLink[] = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ...(canManageOrders
      ? [
          {
            to: '/admin/orders',
            label: 'Buyurtmalar',
            icon: ClipboardList,
            exact: false,
          },
        ]
      : []),
    ...(canManageProducts
      ? [
          {
            to: '/admin/products',
            label: 'Mahsulotlar',
            icon: Package,
            exact: false,
          },
        ]
      : []),
    ...(canManagePickupLocations
      ? [
          {
            to: '/admin/pickup-locations',
            label: 'Olib ketish punktlari',
            icon: MapPin,
            exact: false,
          },
        ]
      : []),
    ...(isTrueAdmin
      ? [
          {
            to: '/admin/users',
            label: 'Foydalanuvchilar',
            icon: Users,
            exact: false,
          },
        ]
      : []),
  ];

  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className='flex min-h-screen bg-brand-bg'>
      <aside className='hidden w-64 shrink-0 border-r border-stone-200 bg-white md:flex md:flex-col'>
        <Link
          to='/'
          className='flex items-center gap-2 border-b border-stone-100 px-6 py-5'
        >
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-brand shadow-sm shadow-brand/20'>
            <span className='text-sm font-black text-white'>Z</span>
          </div>
          <div>
            <p className='text-sm font-extrabold text-brand'>Zazzle</p>
            <p className='text-[10px] font-medium uppercase tracking-wider text-brand-muted'>
              Admin panel
            </p>
          </div>
        </Link>

        <nav className='flex-1 space-y-1 px-3 py-4'>
          {navLinks.map(link => {
            const Icon = link.icon;
            const active = isActive(link.to, link.exact);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-slate-600 hover:bg-amber-50/60 hover:text-slate-900'
                )}
              >
                <Icon className='h-4 w-4' />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className='border-t border-stone-100 p-3'>
          <Link
            to='/'
            className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-stone-50'
          >
            <Store className='h-4 w-4' />
            Do&apos;konga qaytish
          </Link>
          <button
            type='button'
            onClick={() => logoutMutation.mutate()}
            className='flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50'
          >
            <LogOut className='h-4 w-4' />
            Chiqish
          </button>
        </div>
      </aside>

      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:px-8'>
          <p className='text-sm font-semibold text-slate-900'>Admin panel</p>
          <p className='text-xs text-slate-500'>{user?.email}</p>
        </header>
        <main className='flex-1 px-4 py-6 md:px-8 md:py-8'>{children}</main>
      </div>
    </div>
  );
}
