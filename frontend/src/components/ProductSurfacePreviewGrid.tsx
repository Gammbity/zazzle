import { cn } from '@/lib/utils';
import ProductColorizedImage from '@/components/ProductColorizedImage';
import type { OverlayBox, ProductAngle } from '@/lib/products/catalog';

interface ProductSurfacePreviewGridProps {
  angles: ProductAngle[];
  productName: string;
  designUrlsByAngle: Record<string, string | null | undefined>;
  fallbackOverlayBox?: OverlayBox;
  activeAngleId: string;
  productColorHex?: string | null;
  onChangeAngle: (angleId: string) => void;
}

function localizeAngleLabel(label: string) {
  const normalized = label.toLowerCase();

  if (normalized === 'front') return 'Old tomoni';
  if (normalized === 'back') return 'Orqa tomoni';
  if (normalized === 'left') return 'Chap tomoni';
  if (normalized === 'right') return 'Ong tomoni';

  return label;
}

export default function ProductSurfacePreviewGrid({
  angles,
  productName,
  designUrlsByAngle,
  fallbackOverlayBox,
  activeAngleId,
  productColorHex,
  onChangeAngle,
}: ProductSurfacePreviewGridProps) {
  const activeAngle =
    angles.find(angle => angle.id === activeAngleId) ?? angles[0] ?? null;

  if (!activeAngle) {
    return null;
  }

  const activeDesignUrl = designUrlsByAngle[activeAngle.id];
  const overlayBox = activeAngle.overlayBox ?? fallbackOverlayBox;

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap gap-2'>
        {angles.map(angle => (
          <button
            key={angle.id}
            type='button'
            onClick={() => onChangeAngle(angle.id)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              angle.id === activeAngle.id
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            {localizeAngleLabel(angle.label)}
          </button>
        ))}
      </div>

      <article className='rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60'>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.25em] text-sky-700'>
              {localizeAngleLabel(activeAngle.label)}
            </p>
            <p className='mt-1 text-sm text-slate-500'>{productName}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              activeDesignUrl
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {activeDesignUrl ? 'Dizayn bor' : "Bo'sh"}
          </span>
        </div>

        <div className='relative aspect-square overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,_#f8fafc_0%,_#ffffff_50%,_#f0f9ff_100%)]'>
          <ProductColorizedImage
            src={activeAngle.src}
            alt={activeAngle.alt}
            productColorHex={productColorHex}
            fill
            sizes='(max-width: 1024px) 100vw, 50vw'
            className='object-contain p-4'
            priority
          />

          {activeDesignUrl && overlayBox && (
            <div
              className='pointer-events-none absolute overflow-hidden'
              style={{
                left: `${overlayBox.x}%`,
                top: `${overlayBox.y}%`,
                width: `${overlayBox.width}%`,
                height: `${overlayBox.height}%`,
              }}
              aria-hidden='true'
            >
              <img
                src={activeDesignUrl}
                alt={`${productName} ${localizeAngleLabel(activeAngle.label)} ko'rinishi`}
                className='h-full w-full object-contain opacity-85 mix-blend-multiply'
              />
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
