import { Link } from '@/lib/router';

const PRODUCT_LINKS = [
  { to: '/products/t-shirt', label: 'Futbolka' },
  { to: '/products/mug', label: 'Krujka' },
  { to: '/products/business-card', label: 'Vizitka' },
  { to: '/products/desk-calendar', label: 'Stol kalendari' },
  { to: '/products/pen', label: 'Ruchka' },
];

const ACCOUNT_LINKS = [
  { to: '/cart', label: 'Savatcha' },
  { to: '/orders', label: 'Buyurtmalar' },
  { to: '/checkout', label: 'Checkout' },
];

export default function Footer() {
  return (
    <footer className='border-t border-amber-100 bg-amber-50/40'>
      <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {/* Brand */}
          <div className='sm:col-span-2 lg:col-span-1'>
            <div className='flex items-center gap-2'>
              <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-amber-200'>
                <span className='text-sm font-black text-white'>Z</span>
              </div>
              <div>
                <p className='text-sm font-bold text-slate-900'>Zazzle</p>
                <p className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>
                  Uzbekistan
                </p>
              </div>
            </div>
            <p className='mt-4 max-w-xs text-sm leading-6 text-slate-600'>
              Mahsulot tanlash, dizayn qilish va buyurtma berish uchun
              soddalashtirilgan platforma.
            </p>
          </div>

          {/* Mahsulotlar */}
          <div>
            <h3 className='text-sm font-semibold text-slate-900'>Mahsulotlar</h3>
            <ul className='mt-4 space-y-2.5'>
              {PRODUCT_LINKS.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className='text-sm text-slate-600 transition-colors hover:text-amber-700'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hisob */}
          <div>
            <h3 className='text-sm font-semibold text-slate-900'>Hisob</h3>
            <ul className='mt-4 space-y-2.5'>
              {ACCOUNT_LINKS.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className='text-sm text-slate-600 transition-colors hover:text-amber-700'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Aloqa */}
          <div>
            <h3 className='text-sm font-semibold text-slate-900'>Aloqa</h3>
            <ul className='mt-4 space-y-2.5'>
              <li className='text-sm text-slate-600'>
                <span className='font-medium text-slate-700'>Telegram:</span>{' '}
                @zazzle_uz
              </li>
              <li className='text-sm text-slate-600'>
                <span className='font-medium text-slate-700'>Email:</span>{' '}
                info@zazzle.uz
              </li>
              <li className='text-sm text-slate-600'>
                <span className='font-medium text-slate-700'>Ish vaqti:</span>{' '}
                Du-Ju, 9:00–18:00
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='mt-10 flex flex-col items-center justify-between gap-4 border-t border-amber-100 pt-6 sm:flex-row'>
          <p className='text-xs text-slate-500'>
            © {new Date().getFullYear()} Zazzle Uzbekistan. Barcha huquqlar himoyalangan.
          </p>
          <div className='flex gap-4'>
            <Link to='/' className='text-xs text-slate-500 transition-colors hover:text-amber-700'>
              Bosh sahifa
            </Link>
            <Link to='/#products' className='text-xs text-slate-500 transition-colors hover:text-amber-700'>
              Mahsulotlar
            </Link>
            <Link to='/#how-it-works' className='text-xs text-slate-500 transition-colors hover:text-amber-700'>
              Qanday ishlaydi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
