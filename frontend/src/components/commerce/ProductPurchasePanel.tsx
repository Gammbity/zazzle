import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  ShoppingCart,
  Sparkles,
  Truck,
} from 'lucide-react';
import type { Product } from '@/lib/products/catalog';
import { Link } from '@/lib/router';
import { useEditorStore } from '@/store/editorStore';
import CommerceAuthModal from '@/components/commerce/CommerceAuthModal';
import ColorSwatches, { type ColorOption } from '@/components/ui/ColorSwatches';
import QuantityStepper from '@/components/ui/QuantityStepper';
import Skeleton from '@/components/ui/Skeleton';
import VariantButtons from '@/components/ui/VariantButtons';
import { useAddCartItem, useCommerceProduct } from '@/hooks/queries';
import {
  createDraftForCart,
  formatMoney,
  getCommerceErrorMessage,
  isAuthenticated,
  type CommerceVariant,
  type ProductColorSelection,
} from '@/lib/commerce';

interface ProductPurchasePanelProps {
  product: Product;
  previewDataUrl: string | null;
  onProductColorChange?: (color: ProductColorSelection | null) => void;
}

const DEFAULT_PRODUCT_COLORS: ColorOption[] = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#111827' },
  { name: 'Navy', hex: '#1B2951' },
  { name: 'Red', hex: '#E31E24' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Yellow', hex: '#FACC15' },
  { name: 'Pink', hex: '#EC4899' },
];

function normalizeColorHex(hex?: string): string {
  return /^#[\da-f]{6}$/i.test(hex ?? '') ? (hex as string) : '#e2e8f0';
}

export default function ProductPurchasePanel({
  product,
  previewDataUrl,
  onProductColorChange,
}: ProductPurchasePanelProps) {
  const surfaces = useEditorStore(state => state.surfaces);
  const activeSurfaceId = useEditorStore(state => state.activeSurfaceId);

  const productQuery = useCommerceProduct(product.slug);
  const backendProduct = productQuery.data ?? null;
  const loading = productQuery.isLoading;

  const addToCartMutation = useAddCartItem();
  const draftMutation = useMutation({
    mutationFn: createDraftForCart,
  });

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [authOpen, setAuthOpen] = useState(false);
  const [queuedAfterAuth, setQueuedAfterAuth] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const hasDesignContent = useMemo(
    () => surfaces.some(surface => surface.layers.length > 0),
    [surfaces]
  );

  const submitting = draftMutation.isPending || addToCartMutation.isPending;
  const queryError = productQuery.isError
    ? getCommerceErrorMessage(
        productQuery.error,
        "Mahsulotning savdo ma'lumotlarini yuklab bo'lmadi."
      )
    : null;
  const error = actionError ?? queryError;

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
    setSelectedColor(
      defaultVariant.color ||
        backendProduct.available_colors[0]?.name ||
        DEFAULT_PRODUCT_COLORS[0].name
    );
  }, [backendProduct]);

  const availableVariants = useMemo(
    () => backendProduct?.variants ?? [],
    [backendProduct]
  );

  const sizeOptions = useMemo<string[]>(
    () => [
      ...new Set(
        availableVariants
          .map(variant => variant.size)
          .filter((size): size is string => Boolean(size))
      ),
    ],
    [availableVariants]
  );

  const colorOptions = useMemo<ColorOption[]>(() => {
    const colorsForSize = selectedSize
      ? new Set(
          availableVariants
            .filter(variant => variant.size === selectedSize && variant.color)
            .map(variant => variant.color as string)
        )
      : null;

    const colors = new Map<string, ColorOption>();
    const addColor = (option: ColorOption) => {
      const key = option.name.toLowerCase();
      if (!colors.has(key)) {
        colors.set(key, option);
      }
    };

    availableVariants
      .filter((variant): variant is typeof variant & { color: string } =>
        Boolean(variant.color)
      )
      .forEach(variant => {
        addColor({
          name: variant.color,
          hex: normalizeColorHex(variant.color_hex),
          disabled: colorsForSize ? !colorsForSize.has(variant.color) : false,
        });
      });

    backendProduct?.available_colors.forEach(color => {
      addColor({
        name: color.name,
        hex: normalizeColorHex(color.hex),
      });
    });

    DEFAULT_PRODUCT_COLORS.forEach(addColor);

    return [...colors.values()];
  }, [availableVariants, backendProduct, selectedSize]);

  const selectedColorOption = useMemo<ProductColorSelection | null>(() => {
    const option = colorOptions.find(
      color => color.name === selectedColor && !color.disabled
    );

    return option ? { name: option.name, hex: option.hex } : null;
  }, [colorOptions, selectedColor]);

  useEffect(() => {
    if (sizeOptions.length > 0 && !sizeOptions.includes(selectedSize)) {
      setSelectedSize(sizeOptions[0] || '');
    }
  }, [selectedSize, sizeOptions]);

  useEffect(() => {
    const available = colorOptions.filter(option => !option.disabled);
    if (available.length === 0 && selectedColor) {
      setSelectedColor('');
      return;
    }
    if (
      available.length > 0 &&
      !available.some(option => option.name === selectedColor)
    ) {
      setSelectedColor(available[0]?.name ?? '');
    }
  }, [colorOptions, selectedColor]);

  useEffect(() => {
    onProductColorChange?.(selectedColorOption);
  }, [onProductColorChange, selectedColorOption]);

  const selectedVariant: CommerceVariant | null = useMemo(() => {
    if (!backendProduct) {
      return null;
    }

    const selectedColorHasVariant = selectedColor
      ? availableVariants.some(variant => {
          const sizeMatches = selectedSize
            ? variant.size === selectedSize
            : true;
          return sizeMatches && variant.color === selectedColor;
        })
      : false;

    return (
      availableVariants.find(variant => {
        const sizeMatches = selectedSize ? variant.size === selectedSize : true;
        const colorMatches = selectedColorHasVariant
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
    if (!backendProduct || !selectedVariant) return;

    setActionError(null);
    setSuccessMessage(null);

    try {
      const draft = await draftMutation.mutateAsync({
        productTypeId: backendProduct.id,
        variantId: selectedVariant.id,
        productName: product.name,
        productSlug: product.slug,
        activeSurfaceId,
        surfaces,
        previewDataUrl,
        productColor: selectedColorOption,
      });

      await addToCartMutation.mutateAsync({
        draftUuid: draft.uuid,
        quantity,
      });

      setSuccessMessage(
        `${product.name} savatchaga qo'shildi. Endi checkoutga o'tishingiz mumkin.`
      );
    } catch (submitError: unknown) {
      setActionError(
        getCommerceErrorMessage(
          submitError,
          "Savatchaga qo'shishda xatolik yuz berdi."
        )
      );
    }
  };

  const handleAddToCart = async () => {
    if (!hasDesignContent) {
      setActionError("Avval mahsulotga kamida bitta dizayn elementi qo'shing.");
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

  const unitPrice = selectedVariant
    ? formatMoney(selectedVariant.sale_price)
    : product.startingPrice;

  const designReady = hasDesignContent;
  const canSubmit = !submitting && !!selectedVariant && designReady;

  return (
    <>
      <section
        id='purchase'
        aria-labelledby='purchase-heading'
        className='scroll-mt-24 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/50'
      >
        <header className='flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-6'>
          <div>
            <p className='text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700'>
              Buyurtma
            </p>
            <h2
              id='purchase-heading'
              className='mt-2 text-2xl font-semibold text-slate-900'
            >
              {product.name}
            </h2>
            <p className='mt-1.5 text-sm leading-6 text-slate-600'>
              O'lcham va rangni tanlab, dizayningizni savatga yuboring.
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              designReady
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
            }`}
            aria-live='polite'
          >
            {designReady ? (
              <>
                <CheckCircle2 className='h-3.5 w-3.5' aria-hidden />
                Dizayn tayyor
              </>
            ) : (
              <>
                <Sparkles className='h-3.5 w-3.5' aria-hidden />
                Dizaynni boshlang
              </>
            )}
          </div>
        </header>

        <div className='p-6'>
          {loading ? (
            <div className='space-y-4'>
              <Skeleton className='h-5 w-32' rounded='md' />
              <div className='flex gap-2'>
                <Skeleton className='h-10 w-14' rounded='xl' />
                <Skeleton className='h-10 w-14' rounded='xl' />
                <Skeleton className='h-10 w-14' rounded='xl' />
              </div>
              <Skeleton className='h-24 w-full' rounded='2xl' />
              <Skeleton className='h-12 w-full' rounded='2xl' />
            </div>
          ) : error && !backendProduct ? (
            <div className='flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800'>
              <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden />
              <div>
                <p className='font-semibold'>Ma'lumotlarni yuklab bo'lmadi</p>
                <p className='mt-1 text-rose-700'>{error}</p>
              </div>
            </div>
          ) : isUnsupported ? (
            <div className='flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900'>
              <Info className='mt-0.5 h-4 w-4 shrink-0' aria-hidden />
              <div>
                <p className='font-semibold'>Hali savdoga chiqmagan</p>
                <p className='mt-1 text-amber-800'>
                  Dizayn qilishingiz mumkin, lekin narx va buyurtma tez orada
                  ochiladi.
                </p>
              </div>
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='rounded-2xl bg-slate-900 p-5 text-white'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300'>
                  Bir dona narx
                </p>
                <p className='mt-1.5 text-3xl font-semibold tracking-tight'>
                  {unitPrice}
                </p>
                <p className='mt-1 text-xs text-slate-400'>
                  QQS va dizayn narxi kiritilgan
                </p>
              </div>

              {sizeOptions.length > 0 && (
                <VariantButtons
                  label="O'lcham tanlang"
                  name='size'
                  options={sizeOptions.map(size => ({ value: size }))}
                  value={selectedSize}
                  onChange={setSelectedSize}
                />
              )}

              {colorOptions.length > 0 && (
                <ColorSwatches
                  label='Rangni tanlang'
                  options={colorOptions}
                  value={selectedColor}
                  onChange={setSelectedColor}
                />
              )}

              <div className='flex flex-wrap items-end justify-between gap-4'>
                <QuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={500}
                />
                <div className='text-right'>
                  <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                    {quantity} dona jami
                  </p>
                  <p className='mt-0.5 text-xl font-semibold text-slate-900'>
                    {estimatedTotal ?? unitPrice}
                  </p>
                </div>
              </div>

              {!designReady && (
                <div
                  role='status'
                  className='flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs leading-5 text-sky-800'
                >
                  <Sparkles className='mt-0.5 h-4 w-4 shrink-0' aria-hidden />
                  <span>
                    Savatga qo'shishdan avval yuqoridagi muharrirda kamida bitta
                    element qo'shing — matn, rasm yoki stiker.
                  </span>
                </div>
              )}

              {error && backendProduct && (
                <div
                  role='alert'
                  className='flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800'
                >
                  <AlertTriangle
                    className='mt-0.5 h-4 w-4 shrink-0'
                    aria-hidden
                  />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div
                  role='status'
                  className='flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800'
                >
                  <CheckCircle2
                    className='mt-0.5 h-4 w-4 shrink-0'
                    aria-hidden
                  />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className='flex flex-col gap-3 pt-1 sm:flex-row'>
                <button
                  type='button'
                  onClick={() => void handleAddToCart()}
                  disabled={!canSubmit}
                  className='inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:translate-y-0 disabled:bg-slate-300 disabled:shadow-none'
                >
                  <ShoppingCart className='h-4 w-4' aria-hidden />
                  {submitting ? "Qo'shilmoqda..." : "Savatga qo'shish"}
                </button>
                <Link
                  to='/cart'
                  className='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2'
                >
                  Savatga o'tish
                  <ArrowRight className='h-4 w-4' aria-hidden />
                </Link>
              </div>

              <div className='flex items-center gap-2 pt-1 text-xs text-slate-500'>
                <Truck className='h-3.5 w-3.5' aria-hidden />
                <span>
                  Toshkent bo'ylab 2–3 ish kuni, viloyatlarga 3–5 ish kuni
                  ichida yetkazib beriladi.
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

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
