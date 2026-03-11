'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/products/catalog';
import { cn } from '@/lib/utils';
import { triggerNavigationStart } from './NavigationProgress';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isNavigating) return; // Prevent double clicks
      setIsNavigating(true);
      triggerNavigationStart();
      router.push(`/products/${product.slug}`);
    },
    [router, product.slug, isNavigating],
  );

  return (
    <Link
      href={`/products/${product.slug}`}
      prefetch={true}
      onClick={handleClick}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm',
        'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 outline-none',
        isNavigating && 'pointer-events-none opacity-70',
        className,
      )}
      aria-label={`View ${product.name} — ${product.tagline}`}
    >
      {/* Loading overlay */}
      {isNavigating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
        <Image
          src={product.thumbnail}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          priority={false}
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-5">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-1">{product.tagline}</p>
        <p className="mt-auto pt-3 text-sm font-medium text-gray-900">
          from <span className="text-primary-600">{product.startingPrice}</span>
        </p>
      </div>
    </Link>
  );
}
