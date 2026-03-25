'use client';

import { useState, useCallback, useRef } from 'react';
import AppImage from '@/components/AppImage';
import type { OverlayBox } from '@/lib/products/catalog';
import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';

interface ProductMockPreviewProps {
  baseImage: string;
  designUrl: string;
  overlayBox: OverlayBox;
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
    const link = document.createElement('a');
    link.href = designUrl;
    link.download = `${productName.toLowerCase().replace(/\s+/g, '-')}-dizayn.png`;
    link.click();
  }, [designUrl, productName]);

  return (
    <div className='flex flex-col gap-3'>
      <p className='text-sm font-medium text-gray-700'>
        Mahsulotdagi ko'rinish
      </p>

      <div
        ref={composedRef}
        className={cn(
          'relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm',
          previewStyle === 'perspective' && 'perspective-container'
        )}
        style={{ aspectRatio: '1 / 1' }}
      >
        <AppImage
          src={baseImage}
          alt={`${productName} asosiy rasmi`}
          fill
          sizes='(max-width: 768px) 100vw, 400px'
          className='object-contain p-2'
          priority
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
          aria-hidden='true'
        >
          <img
            src={designUrl}
            alt='Mahsulotdagi dizayningiz'
            className={cn(
              'h-full w-full object-contain opacity-85 mix-blend-multiply',
              previewStyle === 'perspective' && 'perspective-design'
            )}
          />
        </div>
      </div>

      <div className='flex gap-2'>
        <button
          onClick={() => setShowFinal(true)}
          className='flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
        >
          Yakuniy ko'rinish
        </button>
        <button
          onClick={downloadPreview}
          className='flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700'
        >
          Dizaynni yuklab olish
        </button>
      </div>

      <p className='text-center text-xs text-gray-400'>
        Bu taxminiy ko'rinish. Yakuniy bosma biroz farq qilishi mumkin.
      </p>

      <Modal
        open={showFinal}
        onClose={() => setShowFinal(false)}
        title={`${productName} - yakuniy ko'rinish`}
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
              alt={`${productName} asosiy rasmi`}
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
                alt='Dizayn qatlami'
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
            Ko'rinishni yuklab olish
          </button>
        </div>
      </Modal>

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
