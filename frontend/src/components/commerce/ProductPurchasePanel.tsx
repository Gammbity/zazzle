import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/products/catalog';
import { Link } from '@/lib/router';
import { useEditorStore } from '@/store/editorStore';
import CommerceAuthModal from '@/components/commerce/CommerceAuthModal';
import {
  addCartItem,
  createDraftForCart,
  fetchCommerceProductBySlug,
  formatMoney,
  getCommerceErrorMessage,
  isAuthenticated,
  type CommerceProductType,
  type CommerceVariant,
} from '@/lib/commerce';

interface ProductPurchasePanelProps {
  product: Product;
  previewDataUrl: string | null;
}

export default function ProductPurchasePanel({
  product,
  previewDataUrl,
}: ProductPurchasePanelProps) {
  const surfaces = useEditorStore(state => state.surfaces);
  const activeSurfaceId = useEditorStore(state => state.activeSurfaceId);
  const [backendProduct, setBackendProduct] =
    useState<CommerceProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [queuedAfterAuth, setQueuedAfterAuth] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasDesignContent = useMemo(
    () => surfaces.some(surface => surface.layers.length > 0),
    [surfaces]
  );

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    void (async () => {
      try {
        const resolved = await fetchCommerceProductBySlug(product.slug);

        if (!cancelled) {
          setBackendProduct(resolved);
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(
            getCommerceErrorMessage(
              loadError,
              "Mahsulotning savdo ma'lumotlarini yuklab bo'lmadi."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [product.slug]);

  useEffect(() => {
    if (!backendProduct) {
      setSelectedSize('');
      setSelectedColor('');
      return;
    }

    const defaultVariant =
      backendProduct.variants.find(variant => variant.is_default) ||
      backendProduct.variants[0];

    if (!defaultVariant) {
      return;
    }

    setSelectedSize(defaultVariant.size || '');
    setSelectedColor(defaultVariant.color || '');
  }, [backendProduct]);

  const availableVariants = useMemo(
    () => backendProduct?.variants ?? [],
    [backendProduct]
  );

  const sizeOptions = useMemo(
    () => [
      ...new Set(
        availableVariants.map(variant => variant.size).filter(Boolean)
      ),
    ],
    [availableVariants]
  );

  const colorOptions = useMemo(() => {
    const variantsForSize = selectedSize
      ? availableVariants.filter(variant => variant.size === selectedSize)
      : availableVariants;

    return [
      ...new Map(
        variantsForSize
          .filter(variant => Boolean(variant.color))
          .map(variant => [
            variant.color,
            {
              name: variant.color,
              hex: variant.color_hex || '#e2e8f0',
            },
          ])
      ).values(),
    ];
  }, [availableVariants, selectedSize]);

  useEffect(() => {
    if (sizeOptions.length > 0 && !sizeOptions.includes(selectedSize)) {
      setSelectedSize(sizeOptions[0] || '');
    }
  }, [selectedSize, sizeOptions]);

  useEffect(() => {
    const colorNames = colorOptions.map(color => color.name);

    if (colorNames.length === 0 && selectedColor) {
      setSelectedColor('');
      return;
    }

    if (colorNames.length > 0 && !colorNames.includes(selectedColor)) {
      setSelectedColor(colorNames[0] || '');
    }
  }, [colorOptions, selectedColor]);

  const selectedVariant: CommerceVariant | null = useMemo(() => {
    if (!backendProduct) {
      return null;
    }

    return (
      availableVariants.find(variant => {
        const sizeMatches = selectedSize ? variant.size === selectedSize : true;
        const colorMatches = selectedColor
          ? variant.color === selectedColor
          : true;
        return sizeMatches && colorMatches;
      }) ||
      availableVariants.find(variant => variant.is_default) ||
      availableVariants[0] ||
      null
    );
  }, [availableVariants, backendProduct, selectedColor, selectedSize]);

  const estimatedTotal = useMemo(() => {
    if (!selectedVariant) {
      return null;
    }

    const unitPrice = Number.parseFloat(selectedVariant.sale_price);

    if (!Number.isFinite(unitPrice)) {
      return null;
    }

    return formatMoney(unitPrice * quantity);
  }, [quantity, selectedVariant]);

  const executeAddToCart = async () => {
    if (!backendProduct || !selectedVariant) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const draft = await createDraftForCart({
        productTypeId: backendProduct.id,
        variantId: selectedVariant.id,
        productName: product.name,
        productSlug: product.slug,
        activeSurfaceId,
        surfaces,
        previewDataUrl,
      });

      await addCartItem(draft.uuid, quantity);
      setSuccessMessage(
        `${product.name} savatchaga qo'shildi. Endi checkoutga o'tishingiz mumkin.`
      );
    } catch (submitError: unknown) {
      setError(
        getCommerceErrorMessage(
          submitError,
          "Savatchaga qo'shishda xatolik yuz berdi."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!hasDesignContent) {
      setError("Avval mahsulotga kamida bitta dizayn elementi qo'shing.");
      return;
    }

    if (!isAuthenticated()) {
      setQueuedAfterAuth(true);
      setAuthOpen(true);
      return;
    }

    await executeAddToCart();
  };

  const isUnsupported = !loading && !error && !backendProduct;

  return (
    <>
      <div className='rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-6 shadow-sm shadow-slate-200/60'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.24em] text-sky-700'>
              Buyurtma bosqichi
            </p>
            <h2 className='mt-3 text-2xl font-semibold text-slate-900'>
              Dizaynni savatga tayyorlang
            </h2>
            <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-600'>
              Variantni tanlang va shu sahifadan savatga yuboring. Checkoutda
              aloqa hamda yetkazib berish ma&apos;lumotlari kiritiladi.
            </p>
          </div>

          <div className='rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600'>
            {hasDesignContent ? 'Dizayn tayyor' : 'Dizayn kutilmoqda'}
          </div>
        </div>

        {loading ? (
          <div className='mt-6 h-40 animate-pulse rounded-[1.5rem] bg-slate-100' />
        ) : error ? (
          <div className='mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-700'>
            {error}
          </div>
        ) : isUnsupported ? (
          <div className='mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800'>
            Bu mahsulot backend katalogidan topilmadi.
            Admin panelda mos product type va variantlar yaratilgach,
            savat/checkout/order oqimi avtomatik faollashadi.
          </div>
        ) : (
          <>
            <div className='mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]'>
              <div className='rounded-[1.5rem] border border-slate-200 bg-white p-5'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  {sizeOptions.length > 0 && (
                    <div>
                      <p className='text-sm font-semibold text-slate-900'>
                        O&apos;lcham
                      </p>
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {sizeOptions.map(size => (
                          <button
                            key={size}
                            type='button'
                            onClick={() => setSelectedSize(size)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                              selectedSize === size
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {colorOptions.length > 0 && (
                    <div>
                      <p className='text-sm font-semibold text-slate-900'>
                        Rang
                      </p>
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {colorOptions.map(color => (
                          <button
                            key={color.name}
                            type='button'
                            onClick={() => setSelectedColor(color.name)}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                              selectedColor === color.name
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className='h-3 w-3 rounded-full border border-black/10 bg-slate-200' />
                            {color.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className='mt-5 flex flex-wrap items-end gap-4'>
                  <label className='block'>
                    <span className='mb-1 block text-sm font-semibold text-slate-900'>
                      Soni
                    </span>
                    <input
                      className='w-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                      type='number'
                      min={1}
                      value={quantity}
                      onChange={event =>
                        setQuantity(
                          Math.max(
                            1,
                            Number.parseInt(event.target.value || '1', 10)
                          )
                        )
                      }
                    />
                  </label>

                  <div className='rounded-2xl bg-slate-50 px-4 py-3'>
                    <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>
                      Tanlangan variant
                    </p>
                    <p className='mt-1 text-sm font-medium text-slate-900'>
                      {selectedVariant?.variant_name ||
                        selectedVariant?.sku ||
                        'Standart'}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className='mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className='mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>
                    {successMessage}
                  </div>
                )}
              </div>

              <div className='rounded-[1.5rem] bg-slate-950 p-5 text-white'>
                <p className='text-sm font-semibold uppercase tracking-[0.2em] text-sky-300'>
                  Qisqa xulosa
                </p>
                <div className='mt-5 rounded-[1.25rem] border border-white/10 bg-white/5 p-4'>
                  <p className='text-sm text-slate-300'>Bir dona narx</p>
                  <p className='mt-2 text-3xl font-semibold'>
                    {selectedVariant
                      ? formatMoney(selectedVariant.sale_price)
                      : product.startingPrice}
                  </p>
                  <div className='mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-slate-200'>
                    <span>{quantity} dona uchun taxminiy jami</span>
                    <span className='text-base font-semibold text-white'>
                      {estimatedTotal ?? 'Tanlang'}
                    </span>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => void handleAddToCart()}
                  disabled={submitting || !selectedVariant}
                  className='mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60'
                >
                  <ShoppingCart className='h-4 w-4' />
                  {submitting ? "Qo'shilmoqda..." : "Savatchaga qo'shish"}
                </button>

                <div className='mt-4 flex flex-wrap gap-3'>
                  <Link
                    to='/cart'
                    className='inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10'
                  >
                    Savatga o&apos;tish
                    <ArrowRight className='h-4 w-4' />
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <CommerceAuthModal
        open={authOpen}
        onClose={() => {
          setQueuedAfterAuth(false);
          setAuthOpen(false);
        }}
        onSuccess={() => {
          setAuthOpen(false);
          if (queuedAfterAuth) {
            setQueuedAfterAuth(false);
            void executeAddToCart();
          }
        }}
      />
    </>
  );
}
