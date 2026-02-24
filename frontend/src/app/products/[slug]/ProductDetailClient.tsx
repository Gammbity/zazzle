'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Product } from '@/lib/products/catalog';
import ProductGallery from '@/components/ProductGallery';

/* Import EditorPanel with SSR disabled (it loads Konva which requires DOM) */
const EditorPanel = dynamic(
  () => import('@/components/editor/EditorPanel'),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

/* Import MugRealisticPreview with SSR disabled (uses HTMLCanvas) */
const MugRealisticPreview = dynamic(
  () => import('@/components/mug/MugRealisticPreview'),
  { ssr: false },
);

function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-10 rounded-xl bg-gray-100" />
      <div className="aspect-square w-full rounded-xl bg-gray-100" />
    </div>
  );
}

interface Props {
  product: Product;
}

export default function ProductDetailClient({ product }: Props) {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [mugCompositeUrl, setMugCompositeUrl] = useState<string | null>(null);

  const isMug = product.slug === 'mug';

  const downloadDesign = useCallback(() => {
    const url = isMug ? mugCompositeUrl : previewDataUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.slug}-design.png`;
    a.click();
  }, [previewDataUrl, mugCompositeUrl, product.slug, isMug]);

  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <nav
        className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8"
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-primary-600 transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/#products"
              className="hover:text-primary-600 transition-colors"
            >
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-gray-900" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* ─── Left column: Gallery + Mock Preview ─── */}
          <div className="flex flex-col gap-8">
            {/* For mug: show realistic canvas-composited preview when design exists */}
            {isMug && previewDataUrl ? (
              <MugRealisticPreview
                designDataUrl={previewDataUrl}
                onCompositeReady={setMugCompositeUrl}
              />
            ) : (
              <ProductGallery
                angles={product.angles}
                productName={product.name}
                designUrl={!isMug ? previewDataUrl : undefined}
                overlayBox={product.overlayBox}
              />
            )}

            {/* Action buttons (only when the user has generated a preview) */}
            {previewDataUrl && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setPreviewDataUrl(null); setMugCompositeUrl(null); }}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear Preview
                </button>
                <button
                  onClick={downloadDesign}
                  className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  Download Design
                </button>
              </div>
            )}
          </div>

          {/* ─── Right column: Info + Editor ─── */}
          <div className="flex flex-col gap-8">
            {/* Product info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-1 text-lg text-primary-600 font-medium">
                {product.tagline}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {product.description}
              </p>
              <p className="mt-4 text-xl font-semibold text-gray-900">
                Starting from{' '}
                <span className="text-primary-600">{product.startingPrice}</span>
              </p>

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-100" />

            {/* Design editor */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Design your {product.name.toLowerCase()}
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                Upload an image, add text or stickers, then hit &quot;Generate Preview&quot;
                to see it on the product.
              </p>

              <EditorPanel
                productSlug={product.slug}
                printableArea={product.printableArea}
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
