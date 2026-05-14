'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';

export default function CartButton() {
  const [mounted, setMounted] = useState(false);
  const count = useCartStore(s => s.totalItems());

  useEffect(() => setMounted(true), []);

  return (
    <Link
      href="/savatcha"
      aria-label="Savatcha"
      className="relative grid h-10 w-10 place-items-center rounded-full text-ink-700 transition hover:bg-ink-100 hover:text-ink-900"
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
      {mounted && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-soft">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
