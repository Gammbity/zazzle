import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/products/catalog';
import { formatMoney } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority }: ProductCardProps) {
  return (
    <Link
      href={`/mahsulotlar/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-ink-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-ink-50 to-white">
        <Image
          src={product.cover}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
          priority={priority}
          className="object-contain p-6 transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-base font-semibold text-ink-900">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-ink-600">{product.tagline}</p>
        <div className="mt-auto flex items-baseline justify-between pt-3">
          <span className="text-lg font-bold text-ink-900">
            {formatMoney(product.basePrice, product.currency)}
          </span>
          <span className="text-xs font-medium text-brand-600">dan boshlab</span>
        </div>
      </div>
    </Link>
  );
}
