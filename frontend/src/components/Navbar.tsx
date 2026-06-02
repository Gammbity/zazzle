import { useCallback, useEffect, useState } from 'react';
import {
  Menu,
  ShoppingCart,
  X,
  Package,
  Home,
  ClipboardList,
} from 'lucide-react';
import { Link, useLocation } from '@/lib/router';
import { useCart } from '@/hooks/queries';
import { isAuthenticated } from '@/lib/commerce';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/', label: 'Bosh sahifa', icon: Home },
  { to: '/#products', label: 'Mahsulotlar', icon: Package },
  { to: '/orders', label: 'Buyurtmalar', icon: ClipboardList },
] as const;

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartQuery = useCart();

  const cartCount = cartQuery.data?.total_items ?? 0;
  const showCartBadge = isAuthenticated() && cartCount > 0;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isActive = useCallback(
    (to: string) => {
      if (to === '/') return location.pathname === '/';
      if (to.includes('#')) return location.pathname === '/' && location.hash === '#products';
      return location.pathname.startsWith(to);
    },
    [location.pathname, location.hash]
  );

  return (
    <header className='sticky top-0 z-50 border-b border-amber-100/80 bg-white/95 backdrop-blur-lg'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
        {/* Logo */}
        <Link
          to='/'
          className='flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2'
        >
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-amber-200'>
            <span className='text-sm font-black text-white'>Z</span>
          </div>
          <div className='hidden sm:block'>
            <p className='text-sm font-bold text-slate-900'>Zazzle</p>
            <p className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>
              Uzbekistan
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className='hidden items-center gap-1 md:flex' aria-label='Asosiy navigatsiya'>
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                isActive(link.to)
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-slate-600 hover:bg-amber-50/60 hover:text-slate-900'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: cart + mobile toggle */}
        <div className='flex items-center gap-2'>
          <Link
            to='/cart'
            className={cn(
              'relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
              location.pathname === '/cart'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-stone-200 bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700'
            )}
            aria-label={`Savatcha${showCartBadge ? ` (${cartCount} ta mahsulot)` : ''}`}
          >
            <ShoppingCart className='h-4 w-4' />
            {showCartBadge && (
              <span className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white shadow-sm'>
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {/* Mobile menu button */}
          <button
            type='button'
            onClick={() => setMobileOpen(prev => !prev)}
            className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-600 transition-colors hover:bg-amber-50 md:hidden'
            aria-label={mobileOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className='fixed inset-0 top-[57px] z-40 md:hidden'>
          <div
            className='absolute inset-0 bg-slate-900/20 backdrop-blur-sm'
            onClick={() => setMobileOpen(false)}
            aria-hidden='true'
          />

          <nav
            className='relative mx-4 mt-3 animate-slide-down rounded-2xl border border-amber-100 bg-white p-4 shadow-xl shadow-amber-100/40'
            aria-label='Mobil navigatsiya'
          >
            <div className='flex flex-col gap-1'>
              {NAV_LINKS.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      isActive(link.to)
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-slate-700 hover:bg-amber-50/60'
                    )}
                  >
                    <Icon className='h-4 w-4' />
                    {link.label}
                  </Link>
                );
              })}
              <Link
                to='/cart'
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  location.pathname === '/cart'
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-slate-700 hover:bg-amber-50/60'
                )}
              >
                <ShoppingCart className='h-4 w-4' />
                Savatcha
                {showCartBadge && (
                  <span className='ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700'>
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
