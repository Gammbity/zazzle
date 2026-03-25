'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Product } from '@/lib/products/catalog';
import ProductGallery from '@/components/ProductGallery';

/* Import EditorPanel with SSR disabled (it loads Konva which requires DOM) */
const EditorPanel = dynamic(() => import('@/components/editor/EditorPanel'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

/* Import MugRealisticPreview with SSR disabled (uses HTMLCanvas) */
const MugRealisticPreview = dynamic(
  () => import('@/components/mug/MugRealisticPreview'),
  { ssr: false }
);
const PenRealisticPreview = dynamic(
  () => import('@/components/pen/PenRealisticPreview'),
  { ssr: false }
);

function EditorSkeleton() {
  return (
    <div className='flex animate-pulse flex-col gap-4'>
      <div className='h-10 rounded-xl bg-gray-100' />
      <div className='aspect-square w-full rounded-xl bg-gray-100' />
    </div>
  );
}

interface Props {
  product: Product;
}

export default function ProductDetailClient({ product }: Props) {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [cylindricalCompositeUrl, setCylindricalCompositeUrl] = useState<
    string | null
  >(null);

  const isMug = product.slug === 'mug';
  const isPen = product.slug === 'pen';
  const isCylindrical = isMug || isPen;

  // Get printableArea from first angle (fallback to default if not available)
  const printableArea = product.angles[0]?.printableArea ?? {
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  };

  const downloadDesign = useCallback(() => {
    const url = isCylindrical ? cylindricalCompositeUrl : previewDataUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.slug}-dizayn.png`;
    a.click();
  }, [cylindricalCompositeUrl, isCylindrical, previewDataUrl, product.slug]);

  return (
    <main className='min-h-screen bg-white'>
      {/* Breadcrumb */}
      <nav
        className='mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8'
        aria-label="Yo'nalish"
      >
        <ol className='flex items-center gap-2 text-sm text-gray-500'>
          <li>
            <Link href='/' className='transition-colors hover:text-primary-600'>
              Bosh sahifa
            </Link>
          </li>
          <li aria-hidden='true'>/</li>
          <li>
            <Link
              href='/#products'
              className='transition-colors hover:text-primary-600'
            >
              Mahsulotlar
            </Link>
          </li>
          <li aria-hidden='true'>/</li>
          <li className='font-medium text-gray-900' aria-current='page'>
            {product.name}
          </li>
        </ol>
      </nav>

      <div className='mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8'>
        <div className='grid gap-10 lg:grid-cols-2 lg:gap-16'>
          {/* ─── Left column: Gallery + Mock Preview ─── */}
          <div className='flex flex-col gap-8'>
            {isMug && previewDataUrl ? (
              <MugRealisticPreview
                designDataUrl={previewDataUrl}
                onCompositeReady={setCylindricalCompositeUrl}
              />
            ) : isPen && previewDataUrl ? (
              <PenRealisticPreview
                designDataUrl={previewDataUrl}
                onCompositeReady={setCylindricalCompositeUrl}
              />
            ) : (
              <ProductGallery
                angles={product.angles}
                productName={product.name}
                designUrl={
                  !isCylindrical && previewDataUrl ? previewDataUrl : undefined
                }
                overlayBox={product.overlayBox}
              />
            )}

            {/* Action buttons (only when the user has a design) */}
            {previewDataUrl && previewDataUrl.length > 0 && (
              <div className='flex gap-2'>
                <button
                  onClick={downloadDesign}
                  className='w-full rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700'
                >
                  Dizaynni yuklab olish
                </button>
              </div>
            )}
          </div>

          {/* ─── Right column: Info + Editor ─── */}
          <div className='flex flex-col gap-8'>
            {/* Product info */}
            <div>
              <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>
                {product.name}
              </h1>
              <p className='mt-1 text-lg font-medium text-primary-600'>
                {product.tagline}
              </p>
              <p className='mt-4 leading-relaxed text-gray-600'>
                {product.description}
              </p>
              <p className='mt-4 text-xl font-semibold text-gray-900'>
                Boshlanish narxi{' '}
                <span className='text-primary-600'>
                  {product.startingPrice}
                </span>
              </p>

              {/* Tags */}
              <div className='mt-4 flex flex-wrap gap-2'>
                {product.tags.map(tag => (
                  <span
                    key={tag}
                    className='rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600'
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Divider */}
            <hr className='border-gray-100' />

            {/* Design editor */}
            <div>
              <h2 className='mb-3 text-lg font-semibold text-gray-900'>
                {product.name} dizayni
              </h2>
              <p className='mb-4 text-sm text-gray-500'>
                Rasm yuklang, matn yoki stiker qo'shing - dizayn mahsulotda
                darhol ko'rinadi.
              </p>

              <EditorPanel
                productSlug={product.slug}
                printableArea={printableArea}
                canvasAspect={product.canvasAspect}
                onPreviewGenerated={setPreviewDataUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
