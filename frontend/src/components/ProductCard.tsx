import { useCallback, useState } from 'react';
import { ArrowUpRight, Eye, Sparkles } from 'lucide-react';
import AppImage from '@/components/AppImage';
import type { Product } from '@/lib/products/catalog';
import { getProductUiContent } from '@/lib/products/content';
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
  const ui = getProductUiContent(product);

  const go = useCallback(
    (hash?: string) => {
      if (isNavigating) return;
      setIsNavigating(true);
      triggerNavigationStart();
      navigate(`/products/${product.slug}${hash ?? ''}`);
    },
    [isNavigating, navigate, product.slug]
  );

  const handleCardClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      go();
    },
    [go]
  );

  const handleAction = useCallback(
    (event: React.MouseEvent, hash?: string) => {
      event.preventDefault();
      event.stopPropagation();
      go(hash);
    },
    [go]
  );

  return (
    <Link
      to={`/products/${product.slug}`}
      onClick={handleCardClick}
      aria-label={`${product.name} — boshlash ${product.startingPrice}`}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40',
        'outline-none transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-300/40 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
        isNavigating && 'pointer-events-none opacity-70',
        className
      )}
    >
      {isNavigating && (
        <div className='absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-sm'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600' />
        </div>
      )}

      <div className='relative aspect-square overflow-hidden bg-[linear-gradient(135deg,_#f8fafc_0%,_#ffffff_50%,_#eff6ff_100%)]'>
        {ui.badge && (
          <span className='absolute left-4 top-4 z-[1] rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm'>
            {ui.badge}
          </span>
        )}
        <span className='absolute right-4 top-4 z-[1] rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-700 shadow-sm ring-1 ring-slate-200/60'>
          {ui.categoryLabel}
        </span>

        <AppImage
          src={product.thumbnail}
          alt={product.name}
          fill
          sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
          className='object-contain p-8 transition-transform duration-500 ease-out group-hover:scale-[1.04]'
          fallbackLabel={product.name}
        />

        <div className='pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-4 items-center justify-center gap-2 p-4 opacity-0 transition-all duration-300 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100'>
          <button
            type='button'
            onClick={event => handleAction(event)}
            className='inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500'
          >
            <Eye className='h-3.5 w-3.5' aria-hidden />
            Ko'rish
          </button>
          <button
            type='button'
            onClick={event => handleAction(event, '#editor')}
            className='inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2'
          >
            <Sparkles className='h-3.5 w-3.5' aria-hidden />
            Sozlash
          </button>
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-3 p-5'>
        <div>
          <h3 className='text-lg font-semibold leading-tight text-slate-900 transition-colors group-hover:text-sky-700'>
            {product.name}
          </h3>
          <p className='mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600'>
            {ui.shortTagline}
          </p>
        </div>

        <div className='mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4'>
          <div>
            <p className='text-[11px] font-medium uppercase tracking-wider text-slate-500'>
              Boshlanish narxi
            </p>
            <p className='mt-0.5 text-lg font-semibold text-slate-900'>
              {product.startingPrice}
            </p>
          </div>
          <span className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-700 transition-all group-hover:-translate-y-0.5 group-hover:bg-sky-100'>
            <ArrowUpRight className='h-4 w-4' aria-hidden />
            <span className='sr-only'>Mahsulotni ochish</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
