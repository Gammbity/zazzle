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
            const surfaceState = editorSurfaces.find(s => s.id === angle.id);
            if (!surfaceState || surfaceState.layers.length === 0)
              return [angle.id, null] as const;
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
  }, [editorProductId, editorSurfaces, isDraftLoaded, isTshirt, product.angles, product.canvasAspect, product.slug]);

  const hasTshirtPreview = useMemo(
    () => Object.values(surfacePreviewUrls).some(Boolean),
    [surfacePreviewUrls]
  );
  const activeTshirtSurfaceId =
    product.angles.find(a => a.id === activeSurfaceId)?.id ??
    product.angles[0]?.id ??
    'front';

  const hasDesign = isTshirt ? hasTshirtPreview : Boolean(previewDataUrl);

  return (
    <main className='min-h-screen bg-brand-bg'>
      {/* Breadcrumb */}
      <nav className='mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8' aria-label="Yo'nalish">
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

      {/* 2-column: left sticky preview, right scrollable (editor + purchase) */}
      <div className='mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start'>

          {/* Left: Preview — sticky so it stays visible while right scrolls */}
          <div className='lg:sticky lg:top-[4.5rem]'>
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

          </div>

          {/* Right: Purchase first (color/size/buy), then Editor */}
          <div className='flex flex-col gap-5'>
            {/* Purchase panel — user sees this FIRST before scrolling to editor */}
            <ProductPurchasePanel
              product={product}
              previewDataUrl={previewDataUrl}
              onProductColorChange={setSelectedProductColor}
            />

            {/* Editor below purchase */}
            <div className='rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50 sm:p-6'>
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

      {/* Mobile sticky bottom bar */}
      <div
        className='sticky bottom-0 z-40 border-t border-amber-100 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.10)] backdrop-blur lg:hidden'
        aria-label='Buyurtma paneli'
      >
        <div className='mx-auto flex max-w-xl items-center justify-between gap-3'>
          <div>
            <p className='text-xs font-medium text-slate-500'>{product.name}</p>
            <p className='text-sm font-semibold text-slate-900'>{product.startingPrice}</p>
          </div>
          <a
            href='#purchase'
            className='inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-200 transition active:scale-95 hover:bg-amber-700'
          >
            <ShoppingCart className='h-4 w-4' />
            Savatga qo&apos;shish
          </a>
        </div>
      </div>
    </main>
  );
}
