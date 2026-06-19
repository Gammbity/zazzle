import { useCallback, useState } from 'react';
import AppImage from '@/components/AppImage';
import type { Product } from '@/lib/products/catalog';
import { cn } from '@/lib/utils';
import { triggerNavigationStart } from './NavigationProgress';
import { Link, useNavigate } from '@/lib/router';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const go = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    triggerNavigationStart();
    navigate(`/products/${product.slug}`);
  }, [isNavigating, navigate, product.slug]);

  const handleCardClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      go();
    },
    [go]
  );

  return (
    <Link
      to={`/products/${product.slug}`}
      onClick={handleCardClick}
      aria-label={`${product.name} — boshlash ${product.startingPrice}`}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white shadow-sm shadow-stone-100/50',
        'outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-200/50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        isNavigating && 'pointer-events-none opacity-70',
        className
      )}
    >
      {isNavigating && (
        <div className='absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-sm'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-amber-100 border-t-brand' />
        </div>
      )}

      <div className='p-3 pb-0'>
        <div className='relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-surface-low'>
          <AppImage
            src={product.thumbnail}
            alt={product.name}
            fill
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
            className='object-cover transition-transform duration-500 ease-out group-hover:scale-105'
            fallbackLabel={product.name}
          />
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-2 p-6'>
        <div className='flex-1'>
          <h3 className='text-xl font-bold leading-tight text-[#1b1c1b]'>
            {product.name}
          </h3>
          <p className='mt-1 text-sm font-semibold text-brand-muted'>
            {product.startingPrice}
          </p>
        </div>

        <button
          type='button'
          onClick={handleCardClick}
          className='mt-4 w-full rounded-full border border-amber-100 bg-white py-2 text-sm font-semibold text-brand transition-colors hover:bg-amber-50'
        >
          Dizayn qilish
        </button>
      </div>
    </Link>
  );
}
