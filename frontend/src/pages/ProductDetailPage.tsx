'use client';

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { Product } from '@/lib/products/catalog';
import ProductGallery from '@/components/ProductGallery';
import { Link } from '@/lib/router';

const EditorPanel = lazy(() => import('@/components/editor/EditorPanel'));
const MugRealisticPreview = lazy(
  () => import('@/components/mug/MugRealisticPreview')
);

function EditorSkeleton() {
  return (
    <div className='flex animate-pulse flex-col gap-4'>
      <div className='h-10 rounded-xl bg-gray-100' />
      <div className='aspect-square w-full rounded-xl bg-gray-100' />
    </div>
  );
}

export default function ProductDetailPage({ product }: { product: Product }) {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [mugCompositeUrl, setMugCompositeUrl] = useState<string | null>(null);

  const isMug = product.slug === 'mug';

  useEffect(() => {
    document.title = `${product.name} | Zazzle Uzbekistan`;
  }, [product.name]);

  const downloadDesign = useCallback(() => {
    const url = isMug ? mugCompositeUrl : previewDataUrl;

    if (!url) return;

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${product.slug}-design.png`;
    anchor.click();
  }, [isMug, mugCompositeUrl, previewDataUrl, product.slug]);

  return (
    <main className='min-h-screen bg-white'>
      <nav
        className='mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8'
        aria-label='Breadcrumb'
      >
        <ol className='flex items-center gap-2 text-sm text-gray-500'>
          <li>
            <Link to='/' className='transition-colors hover:text-primary-600'>
              Home
            </Link>
          </li>
          <li aria-hidden='true'>/</li>
          <li>
            <Link
              to='/#products'
              className='transition-colors hover:text-primary-600'
            >
              Products
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
          <div className='flex flex-col gap-8'>
            <Suspense fallback={<EditorSkeleton />}>
              {isMug && previewDataUrl ? (
                <MugRealisticPreview
                  designDataUrl={previewDataUrl}
                  onCompositeReady={setMugCompositeUrl}
                />
              ) : (
                <ProductGallery
                  angles={product.angles}
                  productName={product.name}
                  designUrl={
                    !isMug && previewDataUrl ? previewDataUrl : undefined
                  }
                  overlayBox={product.overlayBox}
                />
              )}
            </Suspense>

            {previewDataUrl && (
              <div className='flex gap-2'>
                <button
                  onClick={downloadDesign}
                  className='w-full rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700'
                >
                  Download Design
                </button>
              </div>
            )}
          </div>

          <div className='flex flex-col gap-8'>
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
                Starting from{' '}
                <span className='text-primary-600'>
                  {product.startingPrice}
                </span>
              </p>

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

            <hr className='border-gray-100' />

            <div>
              <h2 className='mb-3 text-lg font-semibold text-gray-900'>
                Design your {product.name.toLowerCase()}
              </h2>
              <p className='mb-4 text-sm text-gray-500'>
                Upload an image, add text or stickers. Your design appears on
                the product instantly.
              </p>

              <Suspense fallback={<EditorSkeleton />}>
                <EditorPanel
                  productSlug={product.slug}
                  onPreviewGenerated={setPreviewDataUrl}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
