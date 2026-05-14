import Link from 'next/link';
import { User } from 'lucide-react';
import CartButton from './CartButton';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
            <span className="text-sm font-bold">Z</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-ink-900">
            zazzle<span className="text-brand-600">.uz</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/mahsulotlar" className="text-sm font-medium text-ink-700 transition hover:text-brand-600">
            Mahsulotlar
          </Link>
          <Link href="/dizaynerlar" className="text-sm font-medium text-ink-700 transition hover:text-brand-600">
            Dizaynerlar
          </Link>
          <Link href="/blog" className="text-sm font-medium text-ink-700 transition hover:text-brand-600">
            Blog
          </Link>
          <Link href="/biz-haqimizda" className="text-sm font-medium text-ink-700 transition hover:text-brand-600">
            Biz haqimizda
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/profil"
            aria-label="Profil"
            className="grid h-10 w-10 place-items-center rounded-full text-ink-700 transition hover:bg-ink-100 hover:text-ink-900"
          >
            <User className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
