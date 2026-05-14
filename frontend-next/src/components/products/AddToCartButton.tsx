'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/products/catalog';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';

export default function AddToCartButton({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const add = useCartStore(s => s.add);

  function handleAdd() {
    add({
      id: product.slug,
      slug: product.slug,
      name: product.name,
      cover: product.cover,
      unitPrice: product.basePrice,
      currency: product.currency,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleBuyNow() {
    handleAdd();
    router.push('/savatcha');
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        onClick={handleBuyNow}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700 hover:shadow-elevated"
      >
        <ShoppingCart className="h-4 w-4" /> Hozir sotib olish
      </button>
      <button
        onClick={handleAdd}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-sm font-semibold transition',
          added
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-ink-300 bg-white text-ink-800 hover:border-ink-400 hover:bg-ink-50'
        )}
      >
        {added ? (
          <>
            <Check className="h-4 w-4" /> Qo‘shildi
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" /> Savatchaga
          </>
        )}
      </button>
    </div>
  );
}
