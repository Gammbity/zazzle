'use client';

import { useEffect, useRef, useState } from 'react';
import { catalog } from '@/lib/products/catalog';
import ProductCard from '@/components/ProductCard';
import { cn } from '@/lib/utils';

export default function ProductGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id='products'
      aria-label='Our products'
      className='w-full bg-white py-20 md:py-28'
    >
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Section heading */}
        <div
          className={cn(
            'mb-14 text-center transition-all duration-700',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <p className='mb-2 text-sm font-semibold uppercase tracking-widest text-primary-600'>
            Our Products
          </p>
          <h2 className='text-3xl font-bold text-gray-900 md:text-4xl'>
            What would you like to create?
          </h2>
          <p className='mx-auto mt-4 max-w-2xl text-gray-500'>
            Pick a product, upload your design, and see it come to life — all in
            seconds.
          </p>
        </div>

        {/* Card grid */}
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {catalog.map((product, i) => (
            <div
              key={product.slug}
              className={cn(
                'transition-all duration-700',
                isVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-12 opacity-0'
              )}
              style={{
                transitionDelay: isVisible ? `${i * 120}ms` : '0ms',
              }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
