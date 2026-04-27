import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { catalog } from '@/lib/products/catalog';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import {
  PRODUCT_FILTERS,
  type ProductFilterId,
  getProductUiContent,
} from '@/lib/products/content';
import { cn } from '@/lib/utils';

export default function ProductGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ProductFilterId>('all');

  useEffect(() => {
    const element = sectionRef.current;

    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return catalog
      .filter(product => {
        const ui = getProductUiContent(product);
        const matchesFilter =
          activeFilter === 'all' || ui.categoryId === activeFilter;

        const matchesQuery =
          normalizedQuery.length === 0 ||
          [
            product.name,
            ui.categoryLabel,
            ui.shortTagline,
            ui.summary,
            ...ui.features,
            ...ui.idealFor,
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);

        return matchesFilter && matchesQuery;
      })
      .sort((left, right) => {
        const leftContent = getProductUiContent(left);
        const rightContent = getProductUiContent(right);

        if (leftContent.badge && !rightContent.badge) return -1;
        if (!leftContent.badge && rightContent.badge) return 1;

        return left.name.localeCompare(right.name);
      });
  }, [activeFilter, query]);

  return (
    <section
      ref={sectionRef}
      id='products'
      aria-label="Mahsulotlar ro'yxati"
      className='relative overflow-hidden bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] py-20 md:py-28'
    >
      <div className='pointer-events-none absolute left-0 top-24 h-32 w-32 rounded-full bg-amber-100/40 blur-3xl' />
      <div className='pointer-events-none absolute right-0 top-20 h-40 w-40 rounded-full bg-sky-100/40 blur-3xl' />

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div
          className={cn(
            'mb-14 transition-all duration-700',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className='max-w-3xl'>
            <p className='mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-sky-700'>
              Mahsulotlar
            </p>
            <h2 className='text-3xl font-bold text-slate-900 md:text-4xl'>
              O'zingizga mos mahsulotni tez toping
            </h2>
            <div className='mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-sky-500 to-amber-400' />
          </div>

          <div className='mt-8 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-sm shadow-slate-200/60 backdrop-blur-sm'>
            <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
              <label className='relative block w-full max-w-xl'>
                <span className='sr-only'>Mahsulot qidirish</span>
                <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                <input
                  type='search'
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Masalan, sovg'a, biznes, krujka, ruchka yoki futbolka"
                  className='w-full rounded-2xl border border-white/80 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm shadow-slate-200/50 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200'
                />
              </label>
            </div>

            <div className='mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
              <div className='flex flex-wrap gap-2'>
                {PRODUCT_FILTERS.map(filter => (
                  <button
                    key={filter.id}
                    type='button'
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-all',
                      activeFilter === filter.id
                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    )}
                    aria-pressed={activeFilter === filter.id}
                    title={filter.description}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <p className='text-sm text-slate-500' aria-live='polite'>
                {filteredProducts.length} ta mahsulot topildi
              </p>
            </div>
          </div>
        </div>

        {!isVisible ? (
          <div
            aria-hidden
            className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {filteredProducts.map((product, index) => (
              <div
                key={product.slug}
                className='translate-y-0 opacity-100 transition-all duration-500'
                style={{ transitionDelay: `${Math.min(index * 80, 320)}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className='rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center'>
            <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200'>
              <SearchX className='h-6 w-6 text-slate-400' aria-hidden />
            </div>
            <h3 className='mt-4 text-xl font-semibold text-slate-900'>
              Hech narsa topilmadi
            </h3>
            <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600'>
              Qidiruv so'zini soddalashtiring yoki filtrni qaytadan tanlang — 6
              ta mahsulot turimiz mavjud.
            </p>
            <div className='mt-6 flex flex-wrap justify-center gap-3'>
              <button
                type='button'
                onClick={() => setQuery('')}
                className='rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2'
              >
                Qidiruvni tozalash
              </button>
              <button
                type='button'
                onClick={() => {
                  setQuery('');
                  setActiveFilter('all');
                }}
                className='rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2'
              >
                Barcha mahsulotlarni ko'rish
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
