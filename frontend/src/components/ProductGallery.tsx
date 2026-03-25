'use client';

import { useState, useCallback } from 'react';
import { CheckCircle2, Images } from 'lucide-react';
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
  showImageStatusCard?: boolean;
}

export default function ProductGallery({
  angles,
  productName,
  designUrl,
  overlayBox,
  showImageStatusCard = true,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const localizeAngleLabel = useCallback((label: string) => {
    const normalized = label.toLowerCase();

    if (normalized === 'front') return 'Old tomoni';
    if (normalized === 'back') return 'Orqa tomoni';
    if (normalized === 'left') return 'Chap tomoni';
    if (normalized === 'right') return 'Ong tomoni';

    return label;
  }, []);

  // Safety checks for angles array
  if (!angles || angles.length === 0) {
    return (
      <div className='flex aspect-square w-full items-center justify-center rounded-2xl border border-gray-100 bg-gray-50'>
        <p className='text-gray-500'>Mahsulot rasmlari topilmadi</p>
      </div>
    );
  }

  // Ensure activeIndex is within bounds
  const safeActiveIndex = Math.max(0, Math.min(activeIndex, angles.length - 1));
  const active = angles[safeActiveIndex];
  const activeOverlayBox = active.overlayBox ?? overlayBox;

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
      aria-label={`${productName} galereyasi`}
    >
      {/* Main image */}
      <div className='relative aspect-square w-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,_#f8fafc_0%,_#ffffff_50%,_#f0f9ff_100%)] shadow-sm shadow-slate-200/50'>
        <AppImage
          src={active.src}
          alt={active.alt}
          fill
          sizes='(max-width: 768px) 100vw, 50vw'
          className='object-contain p-4 transition-opacity duration-300'
          priority
        />

        {/* Design overlay */}
        {designUrl && activeOverlayBox && (
          <div
            className='pointer-events-none absolute overflow-hidden'
            style={{
              left: `${activeOverlayBox.x}%`,
              top: `${activeOverlayBox.y}%`,
              width: `${activeOverlayBox.width}%`,
              height: `${activeOverlayBox.height}%`,
            }}
            aria-hidden='true'
          >
            <img
              src={designUrl}
              alt='Dizayningiz'
              className='h-full w-full object-contain opacity-85 mix-blend-multiply'
            />
          </div>
        )}

        {showImageStatusCard && (
          <div className='absolute inset-x-4 bottom-4 rounded-2xl border border-white/80 bg-white/85 p-3 shadow-lg shadow-slate-200/60 backdrop-blur'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.25em] text-sky-700'>
                  {localizeAngleLabel(active.label)}
                </p>
                <p className='mt-1 text-sm text-slate-600'>
                  {designUrl
                    ? "Dizayn mahsulot ustida ko'rinmoqda."
                    : `${productName} ko'rinishi shu yerda yangilanadi.`}
                </p>
              </div>

              <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white'>
                {designUrl ? (
                  <CheckCircle2 className='h-5 w-5 text-emerald-300' />
                ) : (
                  <Images className='h-5 w-5' />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div
        className='flex gap-3 overflow-x-auto pb-1'
        role='tablist'
        aria-label='Mahsulot rasmlarining burchaklari'
        onKeyDown={handleKeyDown}
      >
        {angles.map((angle, i) => (
          <button
            key={angle.id}
            role='tab'
            aria-selected={i === safeActiveIndex}
            aria-label={localizeAngleLabel(angle.label)}
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
