import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, Clock3, PackageCheck } from 'lucide-react';
import type { Product } from '@/lib/products/catalog';
import { getProductUiContent } from '@/lib/products/content';
import ProductGallery from '@/components/ProductGallery';
import ProductSurfacePreviewGrid from '@/components/ProductSurfacePreviewGrid';
import { Link } from '@/lib/router';
import { renderSurfacePreview } from '@/lib/editor/renderSurfacePreview';
import { useEditorStore } from '@/store/editorStore';
import ProductPurchasePanel from '@/components/commerce/ProductPurchasePanel';

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
    <div className='flex animate-pulse flex-col gap-4'>
      <div className='h-10 rounded-xl bg-slate-100' />
      <div className='aspect-square w-full rounded-[1.5rem] bg-slate-100' />
    </div>
  );
}

export default function ProductDetailPage({ product }: { product: Product }) {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
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
  const ui = getProductUiContent(product);

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
              canvasHeight: Math.round(
                EDITOR_CANVAS_BASE / product.canvasAspect
              ),
              cropToPrintArea: true,
            });

            return [angle.id, url] as const;
          })
        );

        if (!cancelled) {
          setSurfacePreviewUrls(Object.fromEntries(entries));
        }
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
    <main className='min-h-screen bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_50%,_#ffffff_100%)]'>
      <nav
        className='mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8'
        aria-label="Yo'nalish"
      >
        <div className='flex flex-wrap items-center gap-3 text-sm text-slate-500'>
          <Link
            to='/'
            className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm shadow-slate-200/50 transition-colors hover:bg-slate-50'
          >
            <ArrowLeft className='h-4 w-4' />
            Bosh sahifa
          </Link>
          <span>/</span>
          <Link
            to='/#products'
            className='transition-colors hover:text-slate-900'
          >
            Mahsulotlar
          </Link>
          <span>/</span>
          <span className='font-medium text-slate-900' aria-current='page'>
            {product.name}
          </span>
        </div>
      </nav>

      <div className='mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8'>
        <div className='grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10'>
          <div className='flex flex-col gap-6'>
            <div className='rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-6'>
              <Suspense fallback={<EditorSkeleton />}>
                {isMug && previewDataUrl ? (
                  <MugRealisticPreview
                    designDataUrl={previewDataUrl}
                    onCompositeReady={() => undefined}
                  />
                ) : isPen && previewDataUrl ? (
                  <PenRealisticPreview
                    designDataUrl={previewDataUrl}
                    onCompositeReady={() => undefined}
                  />
                ) : isTshirt ? (
                  <ProductSurfacePreviewGrid
                    angles={product.angles}
                    productName={product.name}
                    designUrlsByAngle={surfacePreviewUrls}
                    fallbackOverlayBox={product.overlayBox}
                    activeAngleId={activeTshirtSurfaceId}
                    onChangeAngle={setActiveSurface}
                  />
                ) : (
                  <ProductGallery
                    angles={product.angles}
                    productName={product.name}
                    designUrl={
                      !isCylindrical && previewDataUrl
                        ? previewDataUrl
                        : undefined
                    }
                    overlayBox={product.overlayBox}
                  />
                )}
              </Suspense>
            </div>

            <div className='rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div>
                  <p className='text-sm font-semibold uppercase tracking-[0.25em] text-sky-700'>
                    Ko'rinish holati
                  </p>
                  <h2 className='mt-3 text-2xl font-semibold text-slate-900'>
                    {hasDesign
                      ? 'Maket tayyorlanmoqda'
                      : "Dizayn qo'shishni boshlang"}
                  </h2>
                  <p className='mt-2 max-w-xl text-sm leading-6 text-slate-600'>
                    {hasDesign
                      ? isMug
                        ? "Krujka uchun haqiqatga yaqin ko'rinish ham tayyorlanadi."
                        : isPen
                          ? "Ruchka uchun 3D/360 ko'rinish tayyorlanadi va barrel bo'ylab o'ralgan dizaynni aylantirib ko'rish mumkin."
                          : isTshirt
                            ? "Old va orqa tugmalari orqali tomon almashtiriladi, ko'rinishda esa faqat bitta tanlangan tomoni katta ko'rinishda chiqadi."
                            : "Maket mahsulot ustida jonli ko'rinadi. Joylashuvni tekshirib keyin davom etishingiz mumkin."
                      : "Avval muharrir ichida rasm, matn yoki stiker qo'shing. Ko'rinish shu bo'limda avtomatik yangilanadi."}
                  </p>
                </div>

                <div className='inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600'>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      hasDesign ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {hasDesign ? 'Yangilanmoqda' : 'Kutilmoqda'}
                </div>
              </div>

              <div className='mt-5 grid gap-3 sm:grid-cols-3'>
                <div className='rounded-2xl bg-slate-50 p-4'>
                  <p className='text-sm font-medium text-slate-500'>
                    Boshlanish narxi
                  </p>
                  <p className='mt-2 text-lg font-semibold text-slate-900'>
                    {product.startingPrice}
                  </p>
                </div>
                <div className='rounded-2xl bg-slate-50 p-4'>
                  <p className='text-sm font-medium text-slate-500'>
                    Tayyorlash vaqti
                  </p>
                  <p className='mt-2 text-lg font-semibold text-slate-900'>
                    {ui.turnaround}
                  </p>
                </div>
                <div className='rounded-2xl bg-slate-50 p-4'>
                  <p className='text-sm font-medium text-slate-500'>
                    Ko'rinish turi
                  </p>
                  <p className='mt-2 text-lg font-semibold text-slate-900'>
                    {isMug
                      ? 'Haqiqatga yaqin'
                      : isPen
                        ? '3D / 360 aylana'
                        : isTshirt
                          ? 'Old yoki orqa'
                          : "Jonli ko'rinish"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-6'>
            {!isTshirt && (
              <div className='overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300'>
                    {ui.categoryLabel}
                  </span>
                  {ui.badge && (
                    <span className='rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-950'>
                      {ui.badge}
                    </span>
                  )}
                </div>

                <h1 className='mt-5 text-3xl font-bold sm:text-4xl'>
                  {product.name}
                </h1>
                <p className='mt-3 text-lg font-medium text-sky-300'>
                  {ui.shortTagline}
                </p>
                <p className='mt-4 max-w-3xl text-base leading-7 text-slate-300'>
                  {ui.summary}
                </p>

                <div className='mt-6 grid gap-3 sm:grid-cols-3'>
                  <div className='rounded-2xl bg-white/5 p-4'>
                    <div className='flex items-center gap-2 text-sky-300'>
                      <BadgeCheck className='h-4 w-4' />
                      <span className='text-sm font-medium'>Ishonch</span>
                    </div>
                    <p className='mt-2 text-sm leading-6 text-slate-300'>
                      Ko'rinish va bosma hududi aniq ko'rsatiladi.
                    </p>
                  </div>
                  <div className='rounded-2xl bg-white/5 p-4'>
                    <div className='flex items-center gap-2 text-sky-300'>
                      <Clock3 className='h-4 w-4' />
                      <span className='text-sm font-medium'>Tezkorlik</span>
                    </div>
                    <p className='mt-2 text-sm leading-6 text-slate-300'>
                      {ui.turnaround} ichida tayyorlash uchun mos oqim.
                    </p>
                  </div>
                  <div className='rounded-2xl bg-white/5 p-4'>
                    <div className='flex items-center gap-2 text-sky-300'>
                      <PackageCheck className='h-4 w-4' />
                      <span className='text-sm font-medium'>Qulaylik</span>
                    </div>
                    <p className='mt-2 text-sm leading-6 text-slate-300'>
                      Bir sahifada muharrir va ko'rinish yonma-yon ishlaydi.
                    </p>
                  </div>
                </div>

                <div className='mt-6 flex flex-wrap gap-2'>
                  {ui.features.map(feature => (
                    <span
                      key={feature}
                      className='rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200'
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className='rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60'>
              <Suspense fallback={<EditorSkeleton />}>
                <EditorPanel
                  productSlug={product.slug}
                  onPreviewGenerated={setPreviewDataUrl}
                />
              </Suspense>
            </div>

            <ProductPurchasePanel
              product={product}
              previewDataUrl={previewDataUrl}
            />

            {!isTshirt && (
              <div className='rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60'>
                <div>
                  <p className='text-sm font-semibold uppercase tracking-[0.25em] text-sky-700'>
                    Qayerda foydali
                  </p>
                  <h2 className='mt-3 text-2xl font-semibold text-slate-900'>
                    Eng ko'p ishlatiladigan holatlar
                  </h2>
                </div>

                <div className='mt-5 grid gap-3 sm:grid-cols-3'>
                  {ui.idealFor.map(item => (
                    <div
                      key={item}
                      className='rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-700'
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className='mt-5 grid gap-3 md:grid-cols-3'>
                  {ui.trustPoints.map(point => (
                    <div
                      key={point}
                      className='rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-600'
                    >
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
