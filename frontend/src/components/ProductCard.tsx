'use client';

import { useCallback, useState } from 'react';
import { ArrowUpRight, Clock3 } from 'lucide-react';
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

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();

      if (isNavigating) {
        return;
      }

      setIsNavigating(true);
      triggerNavigationStart();
      navigate(`/products/${product.slug}`);
    },
    [isNavigating, navigate, product.slug]
  );

  return (
    <Link
      to={`/products/${product.slug}`}
      onClick={handleClick}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[1.85rem] border border-white/70 bg-white/90 shadow-sm shadow-slate-200/60',
        'outline-none transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/70 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
        isNavigating && 'pointer-events-none opacity-70',
        className
      )}
      aria-label={`${product.name} mahsulotini ochish`}
    >
      {isNavigating && (
        <div className='absolute inset-0 z-10 flex items-center justify-center bg-white/75'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600' />
        </div>
      )}

      <div className='relative flex aspect-square flex-col overflow-hidden bg-[linear-gradient(135deg,_#f8fafc_0%,_#ffffff_45%,_#eff6ff_100%)] p-4'>
        <div className='pointer-events-none absolute inset-3 rounded-[1.55rem] border border-white/80 bg-white/20' />
        <div className='pointer-events-none absolute left-5 top-20 h-14 w-14 rounded-full bg-amber-100/35 blur-2xl' />
        <div className='pointer-events-none absolute bottom-6 right-5 h-16 w-16 rounded-full bg-sky-100/35 blur-3xl' />

        <div className='relative z-[1] flex flex-wrap gap-2'>
          <span className='rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 shadow-sm'>
            {ui.categoryLabel}
          </span>
          {ui.badge && (
            <span className='rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm'>
              {ui.badge}
            </span>
          )}
        </div>

        <div className='relative mt-[1cm] min-h-0 flex-1 overflow-hidden rounded-[1.4rem] border border-white/80 bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'>
          <div className='pointer-events-none absolute inset-[7%] rounded-[1.15rem] border border-white/70' />
          <div className='bg-slate-900/8 pointer-events-none absolute inset-x-10 bottom-2 h-5 rounded-full blur-xl' />
          <AppImage
            src={product.thumbnail}
            alt={product.name}
            fill
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
            className='object-contain p-3 transition-transform duration-500 group-hover:scale-105'
            priority={false}
          />
        </div>
      </div>

      <div className='flex flex-1 flex-col p-5'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <h3 className='text-xl font-semibold text-slate-900 transition-colors group-hover:text-sky-700'>
              {product.name}
            </h3>
            <p className='mt-2 text-sm leading-6 text-slate-600'>
              {ui.shortTagline}
            </p>
          </div>
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          {ui.idealFor.slice(0, 2).map(label => (
            <span
              key={label}
              className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600'
            >
              {label}
            </span>
          ))}
        </div>

        <div className='mt-5 flex items-center gap-2 text-sm text-slate-500'>
          <Clock3 className='h-4 w-4 text-amber-500' />
          {ui.turnaround}
        </div>

        <div className='mt-auto pt-6'>
          <div className='flex items-center justify-between gap-4 border-t border-slate-100 pt-4'>
            <p className='text-sm font-medium text-slate-500'>
              Boshlanish narxi
              <span className='mt-1 block text-lg font-semibold text-slate-900'>
                {product.startingPrice}
              </span>
            </p>

            <span className='inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition-colors group-hover:bg-sky-100'>
              Ochish
              <ArrowUpRight className='h-4 w-4' />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
