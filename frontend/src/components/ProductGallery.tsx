'use client';

import { useState, useCallback } from 'react';
import AppImage from '@/components/AppImage';
import type { ProductAngle, OverlayBox } from '@/lib/products/catalog';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  angles: ProductAngle[];
  productName: string;
  /** When set, the design is overlaid on every angle image. */
  designUrl?: string | null;
  /** Overlay bounding box (percentage-based). Required when designUrl is set. */
  overlayBox?: OverlayBox;
}

export default function ProductGallery({
  angles,
  productName,
  designUrl,
  overlayBox,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Safety checks for angles array
  if (!angles || angles.length === 0) {
    return (
      <div className='flex aspect-square w-full items-center justify-center rounded-2xl border border-gray-100 bg-gray-50'>
        <p className='text-gray-500'>No product images available</p>
      </div>
    );
  }

  // Ensure activeIndex is within bounds
  const safeActiveIndex = Math.max(0, Math.min(activeIndex, angles.length - 1));
  const active = angles[safeActiveIndex];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!angles || angles.length === 0) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % angles.length);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + angles.length) % angles.length);
      }
    },
    [angles.length]
  );

  return (
    <div
      className='flex flex-col gap-4'
      role='group'
      aria-label={`${productName} gallery`}
    >
      {/* Main image */}
      <div className='relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50'>
        <AppImage
          src={active.src}
          alt={active.alt}
          fill
          sizes='(max-width: 768px) 100vw, 50vw'
          className='object-contain p-4 transition-opacity duration-300'
          priority
        />

        {/* Design overlay */}
        {designUrl && overlayBox && (
          <div
            className='pointer-events-none absolute overflow-hidden'
            style={{
              left: `${overlayBox.x}%`,
              top: `${overlayBox.y}%`,
              width: `${overlayBox.width}%`,
              height: `${overlayBox.height}%`,
            }}
            aria-hidden='true'
          >
            <img
              src={designUrl}
              alt='Your design'
              className='h-full w-full object-contain opacity-85 mix-blend-multiply'
            />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div
        className='flex gap-3 overflow-x-auto pb-1'
        role='tablist'
        aria-label='Product image angles'
        onKeyDown={handleKeyDown}
      >
        {angles.map((angle, i) => (
          <button
            key={angle.id}
            role='tab'
            aria-selected={i === safeActiveIndex}
            aria-label={angle.label}
            tabIndex={i === safeActiveIndex ? 0 : -1}
            onClick={() => setActiveIndex(i)}
            className={cn(
              'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-gray-50 transition-all duration-200',
              i === safeActiveIndex
                ? 'border-primary-500 ring-2 ring-primary-500/30'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <AppImage
              src={angle.src}
              alt={angle.alt}
              fill
              sizes='64px'
              className='object-contain p-1'
            />
          </button>
        ))}
      </div>
    </div>
  );
}
