import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-ink-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <span className="text-sm font-bold">Z</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">
                zazzle<span className="text-brand-600">.uz</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-ink-600">
              O‘zbekistonda print-on-demand. O‘z dizayningiz bilan har qanday mahsulot.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink-900">Kompaniya</h3>
            <ul className="mt-4 space-y-2 text-sm text-ink-600">
              <li><Link className="hover:text-brand-600" href="/biz-haqimizda">Biz haqimizda</Link></li>
              <li><Link className="hover:text-brand-600" href="/blog">Blog</Link></li>
              <li><Link className="hover:text-brand-600" href="/bog-lanish">Bog‘lanish</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink-900">Yordam</h3>
            <ul className="mt-4 space-y-2 text-sm text-ink-600">
              <li><Link className="hover:text-brand-600" href="/yordam/buyurtma">Buyurtma berish</Link></li>
              <li><Link className="hover:text-brand-600" href="/yordam/to-lov">To‘lov</Link></li>
              <li><Link className="hover:text-brand-600" href="/yordam/yetkazib-berish">Yetkazib berish</Link></li>
              <li><Link className="hover:text-brand-600" href="/yordam/qaytarish">Qaytarish</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink-900">Aloqa</h3>
            <ul className="mt-4 space-y-2 text-sm text-ink-600">
              <li>Toshkent, O‘zbekiston</li>
              <li><a className="hover:text-brand-600" href="tel:+998901234567">+998 90 123 45 67</a></li>
              <li><a className="hover:text-brand-600" href="mailto:hi@zazzle.uz">hi@zazzle.uz</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-ink-200 pt-6 text-sm text-ink-500">
          © {new Date().getFullYear()} zazzle.uz — Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
}
