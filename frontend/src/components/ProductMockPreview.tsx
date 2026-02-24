'use client';

import Image from 'next/image';
import type { OverlayBox } from '@/lib/products/catalog';
import { cn } from '@/lib/utils';

interface ProductMockPreviewProps {
  /** Base product image path */
  baseImage: string;
  /** User-uploaded design object URL */
  designUrl: string;
  /** Bounding box for design placement (percentage-based) */
  overlayBox: OverlayBox;
  /** Render style: flat (cards/calendars) or perspective (mugs/tees) */
  previewStyle: 'flat' | 'perspective';
  productName: string;
}

export default function ProductMockPreview({
  baseImage,
  designUrl,
  overlayBox,
  previewStyle,
  productName,
}: ProductMockPreviewProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-700">Preview on product</p>

      <div
        className={cn(
          'relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm',
          previewStyle === 'perspective' && 'perspective-container',
        )}
        style={{ aspectRatio: '1 / 1' }}
      >
        {/* Base product image */}
        <Image
          src={baseImage}
          alt={`${productName} base`}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-contain p-2"
          priority
        />

        {/* Design overlay */}
        <div
          className={cn(
            'absolute overflow-hidden',
            previewStyle === 'perspective' && 'perspective-overlay',
          )}
          style={{
            left: `${overlayBox.x}%`,
            top: `${overlayBox.y}%`,
            width: `${overlayBox.width}%`,
            height: `${overlayBox.height}%`,
          }}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={designUrl}
            alt="Your design on product"
            className={cn(
              'h-full w-full object-contain opacity-85 mix-blend-multiply',
              previewStyle === 'perspective' && 'perspective-design',
            )}
          />
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        This is an approximate preview. Final print may vary slightly.
      </p>

      {/* Inline styles for perspective effect — keeps CSS co-located */}
      <style jsx>{`
        .perspective-container {
          perspective: 800px;
        }
        .perspective-overlay {
          transform: rotateY(-2deg) skewY(1deg);
          transform-origin: center center;
        }
        .perspective-design {
          filter: saturate(0.95) contrast(1.05);
        }
      `}</style>
    </div>
  );
}
