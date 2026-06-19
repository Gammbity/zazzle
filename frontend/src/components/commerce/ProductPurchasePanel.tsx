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
        className='scroll-mt-20 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm'
      >
        {/* Header — narx inline */}
        <div className='flex items-center justify-between gap-3 px-5 py-4'>
          <div>
            <h2
              id='purchase-heading'
              className='text-base font-semibold text-slate-900'
            >
              {product.name}
            </h2>
            <p className='mt-0.5 text-xl font-bold text-amber-700'>
              {unitPrice}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              designReady
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-stone-100 text-slate-500'
            }`}
            aria-live='polite'
          >
            {designReady ? '✓ Dizayn tayyor' : 'Dizayn kerak'}
          </span>
        </div>

        {loading ? (
          <div className='space-y-3 border-t border-stone-100 px-5 py-4'>
            <Skeleton className='h-4 w-24' rounded='md' />
            <div className='flex gap-2'>
              <Skeleton className='h-8 w-12' rounded='lg' />
              <Skeleton className='h-8 w-12' rounded='lg' />
              <Skeleton className='h-8 w-12' rounded='lg' />
            </div>
            <Skeleton className='h-9 w-full' rounded='xl' />
          </div>
        ) : error && !backendProduct ? (
          <div className='border-t border-stone-100 px-5 py-4'>
            <p className='flex items-center gap-2 text-sm text-rose-600'>
              <AlertTriangle className='h-4 w-4 shrink-0' />
              {error}
            </p>
          </div>
        ) : isUnsupported ? (
          <div className='border-t border-stone-100 px-5 py-4'>
            <p className='flex items-center gap-2 text-sm text-amber-700'>
              <Info className='h-4 w-4 shrink-0' />
              Tez orada savdoga chiqadi.
            </p>
          </div>
        ) : (
          <>
            {sizeOptions.length > 0 && (
              <div className='border-t border-stone-100 px-5 py-4'>
                <p className='mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  O&apos;lcham
                  {selectedSize && (
                    <span className='ml-2 font-semibold normal-case tracking-normal text-slate-700'>
                      {selectedSize}
                    </span>
                  )}
                </p>
                <div className='flex flex-wrap gap-1.5'>
                  {sizeOptions.map(size => (
                    <button
                      key={size}
                      type='button'
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                        selectedSize === size
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-stone-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {colorOptions.length > 0 && (
              <div className='border-t border-stone-100 px-5 py-4'>
                <p className='mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Rang
                  {selectedColor && (
                    <span className='ml-2 font-semibold normal-case tracking-normal text-slate-700'>
                      {selectedColor}
                    </span>
                  )}
                </p>
                <ColorSwatches
                  options={colorOptions}
                  value={selectedColor}
                  onChange={setSelectedColor}
                />
              </div>
            )}

            {/* Miqdor + jami */}
            <div className='flex items-center justify-between gap-4 border-t border-stone-100 px-5 py-4'>
              <div>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Miqdor
                </p>
                <QuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={500}
                />
              </div>
              {estimatedTotal && (
                <div className='text-right'>
                  <p className='text-xs text-slate-400'>Jami</p>
                  <p className='mt-0.5 text-lg font-bold text-slate-900'>
                    {estimatedTotal}
                  </p>
                </div>
              )}
            </div>

            {/* Xabarlar */}
            {!designReady && (
              <div className='border-t border-stone-100 px-5 py-3'>
                <p className='flex items-center gap-2 text-xs text-amber-700'>
                  <Sparkles className='h-3.5 w-3.5 shrink-0' />
                  Pastdagi muharrirda matn, rasm yoki stiker qo&apos;shing.
                </p>
              </div>
            )}
            {error && backendProduct && (
              <div className='border-t border-stone-100 px-5 py-3'>
                <p className='flex items-center gap-2 text-xs text-rose-600'>
                  <AlertTriangle className='h-3.5 w-3.5 shrink-0' />
                  {error}
                </p>
              </div>
            )}
            {successMessage && (
              <div className='border-t border-stone-100 px-5 py-3'>
                <p className='flex items-center gap-2 text-xs text-emerald-700'>
                  <CheckCircle2 className='h-3.5 w-3.5 shrink-0' />
                  {successMessage}
                </p>
              </div>
            )}

            {/* Tugmalar */}
            <div className='flex gap-2 border-t border-stone-100 px-5 py-4'>
              <button
                type='button'
                onClick={() => void handleAddToCart()}
                disabled={!canSubmit}
                className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400'
              >
                <ShoppingCart className='h-4 w-4' />
                {submitting ? "Qo'shilmoqda..." : "Savatga qo'shish"}
              </button>
              <Link
                to='/cart'
                className='flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-stone-50'
              >
                Savat
                <ArrowRight className='h-3.5 w-3.5' />
              </Link>
            </div>

            {/* Yetkazib berish */}
            <div className='flex items-center gap-2 border-t border-stone-100 px-5 py-3'>
              <Truck className='h-3.5 w-3.5 shrink-0 text-slate-400' />
              <p className='text-xs text-slate-400'>
                Toshkent 2–3 kun · Viloyatlar 3–5 kun
              </p>
            </div>
          </>
        )}
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
