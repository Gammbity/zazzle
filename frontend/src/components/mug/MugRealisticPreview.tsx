'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { composeMugPreview, loadImage } from '@/lib/render/mugRenderer';
import type { MugRenderOptions } from '@/lib/render/mugRenderer';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Asset paths – centralised so they're easy to swap per product angle
// ---------------------------------------------------------------------------

/** Per-angle asset set for the mug renderer. */
export interface MugAngleAssets {
  id: string;
  label: string;
  baseSrc: string;
  maskSrc: string;
  shadingSrc: string;
  displacementSrc?: string;
  /** Design placement box in *pixels* matching the base image size. */
  designBox: { x: number; y: number; w: number; h: number };
}

// Default right-side angle assets (matches the current mug/right.jpg photo)
export const MUG_ANGLE_ASSETS: MugAngleAssets[] = [
  {
    id: 'right',
    label: 'Right',
    baseSrc: '/products/mug/right.jpg',
    maskSrc: '/products/mug/mask.png',
    shadingSrc: '/products/mug/shading.png',
    displacementSrc: '/products/mug/displacement.png',
    // Will be computed dynamically from the base image
    designBox: { x: 0, y: 0, w: 0, h: 0 },
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MugRealisticPreviewProps {
  /** The user design as a data-URL (exported from the editor canvas). */
  designDataUrl: string;
  /** Override angle assets. Falls back to MUG_ANGLE_ASSETS. */
  angleAssets?: MugAngleAssets[];
  /** Called with final composite data-URL for download / further use. */
  onCompositeReady?: (dataUrl: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MugRealisticPreview({
  designDataUrl,
  angleAssets = MUG_ANGLE_ASSETS,
  onCompositeReady,
}: MugRealisticPreviewProps) {
  const [warpIntensity, setWarpIntensity] = useState(0.55);
  const [printOpacity, setPrintOpacity] = useState(0.88);
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderIdRef = useRef(0);

  // Currently we render from the first angle asset
  const asset = angleAssets && angleAssets.length > 0 ? angleAssets[0] : null;

  // Compute designBox from the base image dimensions + known placement %
  const designBoxMemo = useMemo(() => {
    if (!asset || !asset.designBox) {
      return { x: 0, y: 0, w: 0, h: 0 };
    }
    return asset.designBox;
  }, [asset]);

  // -----------------------------------------------------------------------
  // Render pipeline (debounced on slider changes)
  // -----------------------------------------------------------------------

  const render = useCallback(async () => {
    if (!designDataUrl || !asset || !asset.baseSrc || !asset.maskSrc || !asset.shadingSrc) {
      setError('Missing required mug assets or design data');
      return;
    }

    const id = ++renderIdRef.current;
    setRendering(true);
    setError(null);

    try {
      // Preload base to know its dimensions for designBox
      const baseImg = await loadImage(asset.baseSrc);
      const bw = baseImg.naturalWidth;
      const bh = baseImg.naturalHeight;

      // Design placement: 18%–82% horizontally, 20%–70% vertically (matches overlayBox percentages)
      const dBox =
        designBoxMemo && designBoxMemo.w > 0
          ? designBoxMemo
          : {
              x: Math.round(bw * 0.18),
              y: Math.round(bh * 0.2),
              w: Math.round(bw * 0.64),
              h: Math.round(bh * 0.5),
            };

      const opts: MugRenderOptions = {
        designSrc: designDataUrl,
        baseSrc: asset.baseSrc,
        maskSrc: asset.maskSrc,
        shadingSrc: asset.shadingSrc,
        displacementSrc: asset.displacementSrc,
        designBox: dBox,
        warpIntensity,
        printOpacity,
      };

      const url = await composeMugPreview(opts);

      // Guard against stale renders
      if (id !== renderIdRef.current) return;

      setCompositeUrl(url);
      onCompositeReady?.(url);
    } catch (err) {
      if (id !== renderIdRef.current) return;
      console.error('[MugRealisticPreview]', err);
      setError('Failed to render preview. Check that mug assets exist.');
    } finally {
      if (id === renderIdRef.current) setRendering(false);
    }
  }, [designDataUrl, asset, designBoxMemo, warpIntensity, printOpacity, onCompositeReady]);

  // Auto-render on mount and when deps change (debounced)
  useEffect(() => {
    const t = setTimeout(render, 120);
    return () => clearTimeout(t);
  }, [render]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      {/* Preview canvas */}
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-2xl border bg-gray-50 transition-opacity',
          rendering ? 'opacity-60' : 'opacity-100',
          error ? 'border-red-200' : 'border-gray-100',
        )}
      >
        {compositeUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={compositeUrl}
            alt="Mug realistic preview"
            className="h-full w-full object-contain p-2"
          />
        ) : !error ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            {rendering ? 'Rendering…' : 'No preview yet'}
          </div>
        ) : null}
        {error && (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-red-500">
            {error}
          </div>
        )}
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <SliderRow
          label="Wrap intensity"
          value={warpIntensity}
          min={0}
          max={1}
          step={0.05}
          onChange={setWarpIntensity}
        />
        <SliderRow
          label="Print opacity"
          value={printOpacity}
          min={0.5}
          max={1}
          step={0.02}
          onChange={setPrintOpacity}
        />
      </div>

      {/* Download composite */}
      {compositeUrl && (
        <a
          href={compositeUrl}
          download="mug-preview.png"
          className="block w-full rounded-xl bg-primary-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          Download Realistic Preview
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small slider helper
// ---------------------------------------------------------------------------

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-28 text-xs font-medium text-gray-600">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-primary-600
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:shadow"
      />
      <span className="w-10 text-right text-xs tabular-nums text-gray-500">
        {value.toFixed(2)}
      </span>
    </label>
  );
}
