import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fabric } from 'fabric';
import { AlertCircle, ArrowRight, CheckCircle, RotateCcw, Trash2 } from 'lucide-react';
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
import type { useFabricHistory } from './FabricEditorControls';

interface GarmentPurchasePanelProps {
  canvas: fabric.Canvas | null;
  productSlug: string;
  productName: string;
  surfaceId: string;
  getEditorState: () => Record<string, unknown>;
  history: ReturnType<typeof useFabricHistory>;
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

export default function GarmentPurchasePanel({
  canvas,
  productSlug,
  productName,
  surfaceId,
  getEditorState,
  history,
}: GarmentPurchasePanelProps) {
  const router = useRouter();
  const addCartItem = useAddCartItem();
  const [product, setProduct] = useState<CommerceProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [queuedAfterAuth, setQueuedAfterAuth] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchFailed(false);

    void fetchCommerceProductBySlug(productSlug)
      .then(nextProduct => {
        if (cancelled) return;
        setProduct(nextProduct);
      })
      .catch(() => {
        if (!cancelled) {
          setProduct(null);
          setFetchFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productSlug, retryToken]);

  const selectedVariant: CommerceVariant | null = useMemo(() => {
    const variants = product?.variants ?? [];
    return variants.find(variant => variant.is_default) || variants[0] || null;
  }, [product]);

  const unitPrice = selectedVariant ? Number(selectedVariant.sale_price) : 0;

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
      const previewDataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      });
      const draft = await createCustomizerDraftForCart({
        productTypeId: product.id,
        variantId: selectedVariant.id,
        productName,
        productSlug,
        textLayers: extractTextLayers(canvas, surfaceId),
        editorState: {
          active_surface_id: surfaceId,
          fabric_json: canvas.toJSON(),
          preview_data_url: previewDataUrl,
          ...getEditorState(),
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

  const handleOrder = async () => {
    if (!isAuthenticated()) {
      setQueuedAfterAuth(true);
      setAuthOpen(true);
      return;
    }
    await executeAddToCart();
  };

  return (
    <>
      <div className='garment-purchase-panel'>
        <div className='garment-panel-section'>
          <p className='garment-section-title'>Miqdor</p>
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
        </div>

        <div className='garment-panel-section'>
          <p className='garment-section-title'>Narx</p>
          {loading ? (
            <p className='hint-text'>Yuklanmoqda…</p>
          ) : fetchFailed || !selectedVariant ? (
            <div className='garment-price-warning'>
              <span>Mahsulot narxi yuklanmadi.</span>
              <button
                type='button'
                className='garment-retry-btn'
                onClick={() => setRetryToken(token => token + 1)}
              >
                <RotateCcw size={13} /> Qayta urinish
              </button>
            </div>
          ) : (
            <div className='garment-price-rows'>
              <div className='garment-price-row'>
                <span>Bir dona narxi</span>
                <span>{formatMoney(unitPrice)}</span>
              </div>
              <div className='garment-price-row total'>
                <span>Jami narx</span>
                <span>{formatMoney(unitPrice * quantity)}</span>
              </div>
            </div>
          )}
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
          className='garment-cta primary'
          disabled={submitting || !selectedVariant}
          onClick={() => void handleOrder()}
        >
          {submitting ? "Qo'shilmoqda..." : 'Buyurtmani davom ettirish'}
          <ArrowRight size={16} />
        </button>

        <button
          type='button'
          className='garment-cta danger'
          onClick={history.clearDesign}
        >
          <Trash2 size={16} /> Dizaynni tozalash
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
