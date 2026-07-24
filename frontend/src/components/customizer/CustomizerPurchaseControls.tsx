import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fabric } from 'fabric';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ShoppingCart,
} from 'lucide-react';
import CommerceAuthModal from '@/components/commerce/CommerceAuthModal';
import { useAddCartItem } from '@/hooks/queries';
import {
  createCustomizerDraftForCart,
  fetchCommerceProductBySlug,
  formatMoney,
  getCommerceErrorMessage,
  isAuthenticated,
  type CommerceProductType,
  type CommerceVariant,
} from '@/lib/commerce';

interface CustomizerPurchaseControlsProps {
  canvas: fabric.Canvas | null;
  productSlug: string;
  productName: string;
  surfaceId?: string;
  previewDataUrl?: string;
  getEditorState?: () => Record<string, unknown>;
  onProductColorChange?: (hex: string) => void;
  compact?: boolean;
}

function extractTextLayers(canvas: fabric.Canvas | null, surfaceId: string) {
  if (!canvas) return [];

  return canvas
    .getObjects()
    .filter(object =>
      ['text', 'i-text', 'textbox'].includes(String(object.type || ''))
    )
    .map((object, index) => {
      const text = object as fabric.Text;
      return {
        id: `fabric-text-${index + 1}`,
        surface_id: surfaceId,
        text: text.text || '',
        x: text.left || 0,
        y: text.top || 0,
        width: text.width || 0,
        height: text.height || 0,
        font_size: text.fontSize || 32,
        color: String(text.fill || '#111827'),
        font_family: text.fontFamily || 'sans-serif',
        rotation: text.angle || 0,
        opacity: text.opacity ?? 1,
        align: text.textAlign || 'left',
      };
    });
}

export default function CustomizerPurchaseControls({
  canvas,
  productSlug,
  productName,
  surfaceId = 'front',
  previewDataUrl = '',
  getEditorState,
  onProductColorChange,
  compact = false,
}: CustomizerPurchaseControlsProps) {
  const router = useRouter();
  const addCartItem = useAddCartItem();
  const [product, setProduct] = useState<CommerceProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [queuedAfterAuth, setQueuedAfterAuth] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetchCommerceProductBySlug(productSlug)
      .then(nextProduct => {
        if (cancelled) return;
        setProduct(nextProduct);
        const defaultVariant =
          nextProduct?.variants.find(variant => variant.is_default) ||
          nextProduct?.variants[0];
        setSelectedSize(defaultVariant?.size || '');
        setSelectedColor(defaultVariant?.color || '');
        if (defaultVariant?.color_hex) {
          onProductColorChange?.(defaultVariant.color_hex);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProduct(null);
          setError("Mahsulotning savdo ma'lumotlari yuklanmadi.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onProductColorChange, productSlug]);

  const sizes = useMemo(
    () => [
      ...new Set(
        (product?.variants ?? []).map(variant => variant.size).filter(Boolean)
      ),
    ],
    [product]
  );

  const colors = useMemo(() => {
    const map = new Map<string, string>();
    product?.variants.forEach(variant => {
      if (variant.color) map.set(variant.color, variant.color_hex || '#e2e8f0');
    });
    product?.available_colors.forEach(color => {
      if (color.name && !map.has(color.name)) {
        map.set(color.name, color.hex || '#e2e8f0');
      }
    });
    return [...map.entries()].map(([name, hex]) => ({ name, hex }));
  }, [product]);

  const selectedVariant: CommerceVariant | null = useMemo(() => {
    const variants = product?.variants ?? [];
    return (
      variants.find(variant => {
        const sizeMatches = selectedSize ? variant.size === selectedSize : true;
        const colorMatches = selectedColor
          ? variant.color === selectedColor
          : true;
        return sizeMatches && colorMatches;
      }) ||
      variants.find(variant => variant.is_default) ||
      variants[0] ||
      null
    );
  }, [product, selectedColor, selectedSize]);

  const executeAddToCart = async () => {
    if (!canvas || canvas.getObjects().length === 0) {
      setError("Avval rasm, matn yoki stiker qo'shing.");
      return;
    }
    if (!product || !selectedVariant) {
      setError('Mahsulot varianti topilmadi.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const canvasPreview =
        previewDataUrl ||
        canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
      const draft = await createCustomizerDraftForCart({
        productTypeId: product.id,
        variantId: selectedVariant.id,
        productName,
        productSlug,
        textLayers: extractTextLayers(canvas, surfaceId),
        editorState: {
          active_surface_id: surfaceId,
          fabric_json: canvas.toJSON(),
          preview_data_url: canvasPreview,
          product_color: selectedColor,
          ...(getEditorState?.() ?? {}),
        },
      });

      await addCartItem.mutateAsync({ draftUuid: draft.uuid, quantity });
      setSuccess("Dizayn savatga qo'shildi.");
      router.push('/cart');
    } catch (submitError: unknown) {
      setError(
        getCommerceErrorMessage(
          submitError,
          "Dizaynni savatga qo'shib bo'lmadi."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      setQueuedAfterAuth(true);
      setAuthOpen(true);
      return;
    }
    await executeAddToCart();
  };

  if (loading) {
    return <p className='text-sm text-slate-500'>Variantlar yuklanmoqda…</p>;
  }

  return (
    <>
      <div className={compact ? 'purchase-controls-compact' : 'panel mt-5'}>
        {!compact ? (
          <h3 className='mb-3 font-semibold text-slate-800'>Buyurtma</h3>
        ) : null}
        {sizes.length > 0 ? (
          <div className='mb-4'>
            <p className='mb-2 text-sm text-slate-600'>O‘lcham</p>
            <div className='flex flex-wrap gap-2'>
              {sizes.map(size => (
                <button
                  key={size}
                  type='button'
                  className={`action-btn ${selectedSize === size ? 'primary' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {colors.length > 0 ? (
          <div className='mb-4'>
            <p className='mb-2 text-sm text-slate-600'>Rang</p>
            <div className='flex flex-wrap gap-2'>
              {colors.map(color => (
                <button
                  key={color.name}
                  type='button'
                  className='color-swatch'
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  aria-label={color.name}
                  aria-pressed={selectedColor === color.name}
                  onClick={() => {
                    setSelectedColor(color.name);
                    onProductColorChange?.(color.hex);
                  }}
                >
                  {selectedColor === color.name ? (
                    <CheckCircle size={14} color='#2563eb' />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className='mb-4 flex items-center justify-between gap-4'>
          <div className='qty-row'>
            <button
              type='button'
              className='qty-btn'
              onClick={() => setQuantity(value => Math.max(1, value - 1))}
            >
              −
            </button>
            <span className='qty-value'>{quantity}</span>
            <button
              type='button'
              className='qty-btn'
              onClick={() => setQuantity(value => Math.min(500, value + 1))}
            >
              +
            </button>
          </div>
          {selectedVariant ? (
            <strong className='text-slate-800'>
              {formatMoney(Number(selectedVariant.sale_price) * quantity)}
            </strong>
          ) : null}
        </div>

        {error ? (
          <p className='order-feedback error'>
            <AlertCircle size={15} /> {error}
          </p>
        ) : null}
        {success ? (
          <p className='order-feedback success'>
            <CheckCircle size={15} /> {success}
          </p>
        ) : null}

        <button
          type='button'
          className='action-btn primary add-to-cart-btn'
          disabled={submitting || !selectedVariant}
          onClick={() => void handleAddToCart()}
        >
          {!compact ? <ShoppingCart size={18} /> : null}
          {submitting
            ? "Qo'shilmoqda…"
            : compact
              ? 'Buyurtma berish'
              : "Savatga qo'shish"}
          {compact ? <ArrowRight size={18} /> : null}
        </button>
      </div>

      <CommerceAuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setQueuedAfterAuth(false);
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
