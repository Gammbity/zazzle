'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { composeMugPreview, loadImage } from '@/lib/render/mugRenderer';
import { getProductSurface } from '@/lib/products/surfaces';
import {
  getPreviewRect,
  getPreviewRectFromSurface,
} from '@/lib/products/printAreas';
import type { OverlayBox } from '@/lib/products/catalog';
import { cn } from '@/lib/utils';

export interface CylindricalAngleAsset {
  id: string;
  label: string;
  baseSrc: string;
  maskSrc: string;
  shadingSrc: string;
  displacementSrc?: string;
}

interface CylindricalProductPreviewProps {
  productSlug: string;
  productName: string;
  designDataUrl: string;
  angleAssets: CylindricalAngleAsset[];
  fallbackPreviewBox: OverlayBox;
  onCompositeReady?: (dataUrl: string) => void;
  previewAltText?: string;
  previewStageClassName?: string;
  downloadFileName?: string;
  errorMessage?: string;
}

export default function CylindricalProductPreview({
  productSlug,
  productName,
  designDataUrl,
  angleAssets,
  fallbackPreviewBox,
  onCompositeReady,
  previewAltText,
  previewStageClassName = 'aspect-square',
  downloadFileName,
  errorMessage,
}: CylindricalProductPreviewProps) {
  const [warpIntensity, setWarpIntensity] = useState(0.55);
  const [printOpacity, setPrintOpacity] = useState(0.88);
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderIdRef = useRef(0);

  const asset = angleAssets[0] ?? null;

  const render = useCallback(async () => {
    if (
      !designDataUrl ||
      !asset?.baseSrc ||
      !asset?.maskSrc ||
      !asset?.shadingSrc
    ) {
      setRenderError(
        errorMessage ??
          `${productName} uchun kerakli preview resurslari topilmadi.`
      );
      return;
    }

    const renderId = ++renderIdRef.current;
    setRendering(true);
    setRenderError(null);

    try {
      const baseImg = await loadImage(asset.baseSrc);
      const imageWidth = baseImg.naturalWidth;
      const imageHeight = baseImg.naturalHeight;

      const surface = getProductSurface(productSlug, asset.id);
      const designBox = surface
        ? getPreviewRectFromSurface(surface, imageWidth, imageHeight)
        : getPreviewRect(fallbackPreviewBox, imageWidth, imageHeight);

      const url = await composeMugPreview({
        designSrc: designDataUrl,
        baseSrc: asset.baseSrc,
        maskSrc: asset.maskSrc,
        shadingSrc: asset.shadingSrc,
        displacementSrc: asset.displacementSrc,
        designBox,
        warpIntensity,
        printOpacity,
      });

      if (renderId !== renderIdRef.current) {
        return;
      }

      setCompositeUrl(url);
      onCompositeReady?.(url);
    } catch (err) {
      if (renderId !== renderIdRef.current) {
        return;
      }

      console.error('[CylindricalProductPreview]', err);
      setRenderError(
        errorMessage ??
          `${productName} ko'rinishini tayyorlab bo'lmadi. Mahsulot resurslarini tekshiring.`
      );
    } finally {
      if (renderId === renderIdRef.current) {
        setRendering(false);
      }
    }
  }, [
    asset,
    designDataUrl,
    errorMessage,
    fallbackPreviewBox,
    onCompositeReady,
    printOpacity,
    productName,
    productSlug,
    warpIntensity,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(render, 120);
    return () => window.clearTimeout(timeoutId);
  }, [render]);

  return (
    <div className='flex flex-col gap-4'>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-2xl border bg-gray-50 transition-opacity',
          previewStageClassName,
          rendering ? 'opacity-60' : 'opacity-100',
          renderError ? 'border-red-200' : 'border-gray-100'
        )}
      >
        {compositeUrl ? (
          <img
            src={compositeUrl}
            alt={previewAltText ?? `${productName}ning 360 darajali ko'rinishi`}
            className='h-full w-full object-contain p-2'
          />
        ) : !renderError ? (
          <div className='flex h-full items-center justify-center text-sm text-gray-400'>
            {rendering
              ? 'Tayyorlanmoqda...'
              : `${productName} ko'rinishi hali tayyor emas`}
          </div>
        ) : null}

        {renderError && (
          <div className='flex h-full items-center justify-center p-4 text-center text-sm text-red-500'>
            {renderError}
          </div>
        )}

        {rendering && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary-400 border-t-transparent' />
          </div>
        )}
      </div>

      <div className='flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4'>
        <SliderRow
          label="Aylana ta'siri"
          value={warpIntensity}
          min={0}
          max={1}
          step={0.05}
          onChange={setWarpIntensity}
        />
        <SliderRow
          label='Bosma xiraligi'
          value={printOpacity}
          min={0.5}
          max={1}
          step={0.02}
          onChange={setPrintOpacity}
        />
      </div>

      {compositeUrl && (
        <a
          href={compositeUrl}
          download={downloadFileName ?? `${productSlug}-korinish.png`}
          className='block w-full rounded-xl bg-primary-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-700'
        >
          Hozirgi ko'rinishni yuklab olish
        </a>
      )}
    </div>
  );
}

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
  onChange: (value: number) => void;
}) {
  return (
    <label className='flex items-center gap-3'>
      <span className='w-28 text-xs font-medium text-gray-600'>{label}</span>
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        className='h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-primary-600
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:shadow'
      />
      <span className='w-10 text-right text-xs tabular-nums text-gray-500'>
        {value.toFixed(2)}
      </span>
    </label>
  );
}
