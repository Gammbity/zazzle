'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import type { ProductAngle } from '@/lib/products/catalog';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  angles: ProductAngle[];
  productName: string;
}

export default function ProductGallery({ angles, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = angles[activeIndex];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % angles.length);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + angles.length) % angles.length);
      }
    },
    [angles.length],
  );

  return (
    <div className="flex flex-col gap-4" role="group" aria-label={`${productName} gallery`}>
      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
        <Image
          src={active.src}
          alt={active.alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-4 transition-opacity duration-300"
          priority
        />
      </div>

      {/* Thumbnails */}
      <div
        className="flex gap-3 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Product image angles"
        onKeyDown={handleKeyDown}
      >
        {angles.map((angle, i) => (
          <button
            key={angle.id}
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={angle.label}
            tabIndex={i === activeIndex ? 0 : -1}
            onClick={() => setActiveIndex(i)}
            className={cn(
              'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-gray-50 transition-all duration-200',
              i === activeIndex
                ? 'border-primary-500 ring-2 ring-primary-500/30'
                : 'border-gray-200 hover:border-gray-300',
            )}
          >
            <Image
              src={angle.src}
              alt={angle.alt}
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
