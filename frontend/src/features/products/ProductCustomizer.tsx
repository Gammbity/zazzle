'use client';

import dynamic from 'next/dynamic';
import type { Product } from '@/lib/products/catalog';
import {
  businessCardCustomizerConfig,
  calendarCustomizerConfig,
  penCustomizerConfig,
  shopperBagCustomizerConfig,
} from '@/components/customizer/single-surface-presets';

const editorLoading = () => (
  <div className='flex min-h-[70vh] items-center justify-center'>
    <div className='h-10 w-10 animate-spin rounded-full border-4 border-amber-100 border-t-amber-600' />
  </div>
);

const MugCustomizer = dynamic(
  () => import('@/components/customizer/CustomizerWrapper'),
  { ssr: false, loading: editorLoading }
);
const TshirtCustomizer = dynamic(
  () => import('@/components/customizer/TshirtWrapper'),
  { ssr: false, loading: editorLoading }
);
const SingleSurfaceCustomizer = dynamic(
  () => import('@/components/customizer/SingleSurfaceCustomizer'),
  { ssr: false, loading: editorLoading }
);

export default function ProductCustomizer({ product }: { product: Product }) {
  switch (product.slug) {
    case 'mug':
      return <MugCustomizer />;
    case 't-shirt':
    case 'tshirt':
      return <TshirtCustomizer />;
    case 'hoodie':
      return <TshirtCustomizer garment='hoodie' />;
    case 'business-card':
      return <SingleSurfaceCustomizer config={businessCardCustomizerConfig} />;
    case 'desk-calendar':
      return <SingleSurfaceCustomizer config={calendarCustomizerConfig} />;
    case 'pen':
      return <SingleSurfaceCustomizer config={penCustomizerConfig} />;
    case 'shopper-bag':
      return <SingleSurfaceCustomizer config={shopperBagCustomizerConfig} />;
    default:
      return (
        <main className='mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 text-center'>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.25em] text-amber-700'>
              {product.name}
            </p>
            <h1 className='mt-4 text-3xl font-bold text-slate-900'>
              Bu mahsulot editori tayyorlanmoqda
            </h1>
          </div>
        </main>
      );
  }
}
