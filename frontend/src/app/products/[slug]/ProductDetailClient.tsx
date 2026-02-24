'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/products/catalog';
import ProductGallery from '@/components/ProductGallery';
import ImageUpload from '@/components/ImageUpload';
import ProductMockPreview from '@/components/ProductMockPreview';

interface Props {
  product: Product;
}

export default function ProductDetailClient({ product }: Props) {
  const [designUrl, setDesignUrl] = useState<string | null>(null);

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
          {/* -------- Left column: Gallery -------- */}
          <ProductGallery
            angles={product.angles}
            productName={product.name}
          />

          {/* -------- Right column: Info + Upload + Preview -------- */}
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

            {/* Upload */}
            <ImageUpload onImageSelected={setDesignUrl} />

            {/* Mock preview */}
            {designUrl && (
              <ProductMockPreview
                baseImage={product.previewBase}
                designUrl={designUrl}
                overlayBox={product.overlayBox}
                previewStyle={product.previewStyle}
                productName={product.name}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
