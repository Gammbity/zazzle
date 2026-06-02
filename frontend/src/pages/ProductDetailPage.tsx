import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/products/catalog';
import ProductGallery from '@/components/ProductGallery';
import ProductSurfacePreviewGrid from '@/components/ProductSurfacePreviewGrid';
import { Link } from '@/lib/router';
import { renderSurfacePreview } from '@/lib/editor/renderSurfacePreview';
import { useEditorStore } from '@/store/editorStore';
import ProductPurchasePanel from '@/components/commerce/ProductPurchasePanel';
import type { ProductColorSelection } from '@/lib/commerce';

const EditorPanel = lazy(() => import('@/components/editor/EditorPanel'));
const MugRealisticPreview = lazy(
  () => import('@/components/mug/MugRealisticPreview')
);
const PenRealisticPreview = lazy(
  () => import('@/components/pen/PenRealisticPreview')
);

const EDITOR_CANVAS_BASE = 500;

function EditorSkeleton() {
  return (
    <div className='flex animate-pulse flex-col gap-3'>
      <div className='h-10 rounded-xl bg-amber-50' />
      <div className='aspect-square w-full rounded-[1.5rem] bg-amber-50' />
    </div>
  );
}

export default function ProductDetailPage({ product }: { product: Product }) {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [selectedProductColor, setSelectedProductColor] =
    useState<ProductColorSelection | null>(null);
  const [surfacePreviewUrls, setSurfacePreviewUrls] = useState<
    Record<string, string | null>
  >({});

  const editorProductId = useEditorStore(state => state.productId);
  const editorSurfaces = useEditorStore(state => state.surfaces);
  const activeSurfaceId = useEditorStore(state => state.activeSurfaceId);
  const isDraftLoaded = useEditorStore(state => state.isDraftLoaded);
  const hydrateDraft = useEditorStore(state => state.hydrateDraft);
  const setActiveSurface = useEditorStore(state => state.setActiveSurface);

  const isMug = product.slug === 'mug';
  const isPen = product.slug === 'pen';
  const isCylindrical = isMug || isPen;
  const isTshirt = product.slug === 't-shirt';

  useEffect(() => {
    document.title = `${product.name} | Zazzle Uzbekistan`;
  }, [product.name]);

  useEffect(() => {
    void hydrateDraft(product.slug);
  }, [hydrateDraft, product.slug]);

  useEffect(() => {
    if (!isTshirt) {
      setSurfacePreviewUrls({});
      return undefined;
    }
    if (!isDraftLoaded || editorProductId !== product.slug) {
      setSurfacePreviewUrls({});
      return undefined;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const entries = await Promise.all(
          product.angles.map(async angle => {
            const surfaceState = editorSurfaces.find(
              surface => surface.id === angle.id
            );
            if (!surfaceState || surfaceState.layers.length === 0) {
              return [angle.id, null] as const;
            }
            const url = await renderSurfacePreview({
              layers: surfaceState.layers,
              printArea: angle.printableArea,
              canvasWidth: EDITOR_CANVAS_BASE,
              canvasHeight: Math.round(EDITOR_CANVAS_BASE / product.canvasAspect),
              cropToPrintArea: true,
            });
            return [angle.id, url] as const;
          })
        );
        if (!cancelled) setSurfacePreviewUrls(Object.fromEntries(entries));
      })();
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    editorProductId,
    editorSurfaces,
    isDraftLoaded,
    isTshirt,
    product.angles,
    product.canvasAspect,
    product.slug,
  ]);

  const hasTshirtPreview = useMemo(
    () => Object.values(surfacePreviewUrls).some(Boolean),
    [surfacePreviewUrls]
  );
  const activeTshirtSurfaceId =
    product.angles.find(angle => angle.id === activeSurfaceId)?.id ??
    product.angles[0]?.id ??
    'front';

  const hasDesign = isTshirt ? hasTshirtPreview : Boolean(previewDataUrl);

  return (
    <main className='min-h-screen bg-[linear-gradient(180deg,_#fffbeb_0%,_#ffffff_40%,_#ffffff_100%)]'>
      {/* Breadcrumb */}
      <nav
        className='mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8'
        aria-label="Yo'nalish"
      >
        <div className='flex flex-wrap items-center gap-2 text-sm text-slate-500'>
          <Link
            to='/'
            className='inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-colors hover:bg-amber-50'
          >
            <ArrowLeft className='h-3.5 w-3.5' />
            Bosh sahifa
          </Link>
          <span>/</span>
          <Link to='/#products' className='transition-colors hover:text-slate-900'>
            Mahsulotlar
          </Link>
          <span>/</span>
          <span className='font-medium text-slate-900' aria-current='page'>
            {product.name}
          </span>
        </div>
      </nav>

      {/* 3-column layout on xl, 2-column on lg, stacked on mobile */}
      <div className='mx-auto max-w-[1600px] px-4 pb-24 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.2fr)_minmax(0,0.82fr)]'>

          {/* ── Column 1: Preview (sticky on xl) ───────────────────── */}
          <div className='flex flex-col gap-4 xl:sticky xl:top-[4.5rem] xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto'>
            <div className='rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm shadow-stone-100/50 sm:p-5'>
              <Suspense fallback={<EditorSkeleton />}>
                {isMug && previewDataUrl ? (
                  <MugRealisticPreview
                    designDataUrl={previewDataUrl}
                    bodyColor={selectedProductColor?.hex}
                    onCompositeReady={() => undefined}
                  />
                ) : isPen && previewDataUrl ? (
                  <PenRealisticPreview
                    designDataUrl={previewDataUrl}
                    bodyColor={selectedProductColor?.hex}
                    onCompositeReady={() => undefined}
                  />
                ) : isTshirt ? (
                  <ProductSurfacePreviewGrid
                    angles={product.angles}
                    productName={product.name}
                    designUrlsByAngle={surfacePreviewUrls}
                    fallbackOverlayBox={product.overlayBox}
                    activeAngleId={activeTshirtSurfaceId}
                    productColorHex={selectedProductColor?.hex}
                    onChangeAngle={setActiveSurface}
                  />
                ) : (
                  <ProductGallery
                    angles={product.angles}
                    productName={product.name}
                    designUrl={!isCylindrical && previewDataUrl ? previewDataUrl : undefined}
                    overlayBox={product.overlayBox}
                    productColorHex={selectedProductColor?.hex}
                  />
                )}
              </Suspense>
            </div>

            {/* Product info card */}
            <div className='rounded-[2rem] border border-amber-100/80 bg-white p-5 shadow-sm shadow-amber-100/30'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.25em] text-amber-700'>
                    Ko&apos;rinish
                  </p>
                  <h2 className='mt-1.5 text-xl font-semibold text-slate-900'>
                    {product.name}
                  </h2>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    hasDesign
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {hasDesign ? '✓ Tayyor' : 'Kutilmoqda'}
                </span>
              </div>
              <p className='mt-2 text-sm leading-5 text-slate-500'>
                {isTshirt
                  ? 'Old yoki orqa tomoni uchun alohida dizayn qo\'shishingiz mumkin.'
                  : isPen
                    ? 'Ruchka dizayni avtomatik 360° ko\'rinishda chiqadi.'
                    : isMug
                      ? 'Ko\'rinish yaqinlashtirilgan holatda tayyorlanadi.'
                      : 'Ko\'rinish avtomatik yangilanadi.'}
              </p>
              <div className='mt-3 flex flex-wrap gap-2'>
                <span className='rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700'>
                  {product.startingPrice}
                </span>
              </div>
            </div>

            {/* Purchase panel on xl is in col 3, but on lg/mobile show it here */}
            <div className='xl:hidden'>
              <ProductPurchasePanel
                product={product}
                previewDataUrl={previewDataUrl}
                onProductColorChange={setSelectedProductColor}
              />
            </div>
          </div>

          {/* ── Column 2: Editor ────────────────────────────────────── */}
          <div className='flex flex-col gap-4'>
            <div className='rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50 sm:p-6'>
              <Suspense fallback={<EditorSkeleton />}>
                <EditorPanel
                  productSlug={product.slug}
                  onPreviewGenerated={setPreviewDataUrl}
                />
              </Suspense>
            </div>
          </div>

          {/* ── Column 3: Purchase (sticky on xl) ──────────────────── */}
          <div className='hidden xl:block xl:sticky xl:top-[4.5rem] xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto'>
            <ProductPurchasePanel
              product={product}
              previewDataUrl={previewDataUrl}
              onProductColorChange={setSelectedProductColor}
            />
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div
        className='sticky bottom-0 z-40 border-t border-amber-100 bg-white/95 px-4 py-3 shadow-[0_-8px_20px_-12px_rgba(0,0,0,0.12)] backdrop-blur xl:hidden'
        aria-label='Buyurtma paneli'
      >
        <div className='mx-auto flex max-w-2xl items-center justify-between gap-3'>
          <div className='min-w-0'>
            <p className='truncate text-xs font-medium uppercase tracking-wider text-slate-500'>
              {product.name}
            </p>
            <p className='mt-0.5 text-base font-semibold text-slate-900'>
              {product.startingPrice}
            </p>
          </div>
          <a
            href='#purchase'
            className='inline-flex shrink-0 items-center gap-2 rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-amber-600/25 transition-transform active:scale-95 hover:bg-amber-700'
          >
            <ShoppingCart className='h-4 w-4' aria-hidden />
            Savatga qo&apos;shish
          </a>
        </div>
      </div>
    </main>
  );
}
