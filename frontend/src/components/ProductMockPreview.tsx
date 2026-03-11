'use client';

import { useState, useCallback, useRef } from 'react';
import AppImage from '@/components/AppImage';
import type { OverlayBox } from '@/lib/products/catalog';
import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';

interface ProductMockPreviewProps {
  /** Base product image path */
  baseImage: string;
  /** Exported design data-URL (from canvas export) */
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
  const [showFinal, setShowFinal] = useState(false);
  const composedRef = useRef<HTMLDivElement>(null);

  const downloadPreview = useCallback(() => {
    // Create a temporary link to download the design data-URL
    const a = document.createElement('a');
    a.href = designUrl;
    a.download = `${productName.toLowerCase().replace(/\s+/g, '-')}-design.png`;
    a.click();
  }, [designUrl, productName]);

  return (
    <div className='flex flex-col gap-3'>
      <p className='text-sm font-medium text-gray-700'>Preview on product</p>

      <div
        ref={composedRef}
        className={cn(
          'relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm',
          previewStyle === 'perspective' && 'perspective-container'
        )}
        style={{ aspectRatio: '1 / 1' }}
      >
        {/* Base product image */}
        <AppImage
          src={baseImage}
          alt={`${productName} base`}
          fill
          sizes='(max-width: 768px) 100vw, 400px'
          className='object-contain p-2'
          priority
        />

        {/* Design overlay */}
        <div
          className={cn(
            'absolute overflow-hidden',
            previewStyle === 'perspective' && 'perspective-overlay'
          )}
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
            alt='Your design on product'
            className={cn(
              'h-full w-full object-contain opacity-85 mix-blend-multiply',
              previewStyle === 'perspective' && 'perspective-design'
            )}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className='flex gap-2'>
        <button
          onClick={() => setShowFinal(true)}
          className='flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
        >
          View Final
        </button>
        <button
          onClick={downloadPreview}
          className='flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700'
        >
          Download Design
        </button>
      </div>

      <p className='text-center text-xs text-gray-400'>
        This is an approximate preview. Final print may vary slightly.
      </p>

      {/* Final preview modal */}
      <Modal
        open={showFinal}
        onClose={() => setShowFinal(false)}
        title={`${productName} — Final Preview`}
        maxWidth='max-w-3xl'
      >
        <div className='flex flex-col items-center gap-4'>
          <div
            className={cn(
              'relative w-full overflow-hidden rounded-xl bg-gray-50',
              previewStyle === 'perspective' && 'perspective-container'
            )}
            style={{ aspectRatio: '1 / 1' }}
          >
            <AppImage
              src={baseImage}
              alt={`${productName} base`}
              fill
              sizes='(max-width: 768px) 100vw, 700px'
              className='object-contain p-4'
            />
            <div
              className={cn(
                'absolute overflow-hidden',
                previewStyle === 'perspective' && 'perspective-overlay'
              )}
              style={{
                left: `${overlayBox.x}%`,
                top: `${overlayBox.y}%`,
                width: `${overlayBox.width}%`,
                height: `${overlayBox.height}%`,
              }}
            >
              <img
                src={designUrl}
                alt='Design overlay'
                className={cn(
                  'h-full w-full object-contain opacity-85 mix-blend-multiply',
                  previewStyle === 'perspective' && 'perspective-design'
                )}
              />
            </div>
          </div>

          <button
            onClick={downloadPreview}
            className='w-full max-w-xs rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700'
          >
            Download Preview
          </button>
        </div>
      </Modal>

      {/* Inline styles for perspective effect */}
      <style>{`
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
