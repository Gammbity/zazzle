import { useEffect, useState } from 'react';
import AppImage from '@/components/AppImage';
import type { ComponentProps } from 'react';

interface ProductColorizedImageProps extends ComponentProps<typeof AppImage> {
  productColorHex?: string | null;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const WHITE_THRESHOLD = 244;

function parseHexColor(hex?: string | null): Rgb | null {
  const match = (hex ?? '').match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!match) return null;

  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

function isNearlyWhite(color: Rgb): boolean {
  return (
    color.r >= WHITE_THRESHOLD &&
    color.g >= WHITE_THRESHOLD &&
    color.b >= WHITE_THRESHOLD
  );
}

function getPixelMetrics(
  data: Uint8ClampedArray,
  index: number
): { luminance: number; spread: number } {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  return {
    luminance: 0.299 * r + 0.587 * g + 0.114 * b,
    spread: max - min,
  };
}

function isNeutralLightPixel(
  data: Uint8ClampedArray,
  pixelIndex: number
): boolean {
  const index = pixelIndex * 4;
  const alpha = data[index + 3];
  const { luminance, spread } = getPixelMetrics(data, index);
  return alpha > 12 && luminance > 145 && spread < 72;
}

function isBackgroundCandidate(
  data: Uint8ClampedArray,
  pixelIndex: number
): boolean {
  const index = pixelIndex * 4;
  const alpha = data[index + 3];
  const { luminance, spread } = getPixelMetrics(data, index);
  return alpha <= 12 || (luminance > 112 && spread < 86);
}

function markEdgeConnectedBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Uint8Array {
  const background = new Uint8Array(width * height);
  const queue: number[] = [];

  const push = (pixelIndex: number) => {
    if (background[pixelIndex] || !isBackgroundCandidate(data, pixelIndex)) {
      return;
    }

    background[pixelIndex] = 1;
    queue.push(pixelIndex);
  };

  for (let x = 0; x < width; x += 1) {
    push(x);
    push((height - 1) * width + x);
  }

  for (let y = 1; y < height - 1; y += 1) {
    push(y * width);
    push(y * width + width - 1);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    const x = current % width;
    const y = Math.floor(current / width);

    if (x > 0) push(current - 1);
    if (x < width - 1) push(current + 1);
    if (y > 0) push(current - width);
    if (y < height - 1) push(current + width);
  }

  return background;
}

async function colorizeProductImage(src: string, color: Rgb): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return src;

  ctx.drawImage(image, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const background = markEdgeConnectedBackground(data, width, height);

  for (let pixelIndex = 0; pixelIndex < background.length; pixelIndex += 1) {
    if (background[pixelIndex] || !isNeutralLightPixel(data, pixelIndex)) {
      continue;
    }

    const index = pixelIndex * 4;
    const { luminance } = getPixelMetrics(data, index);
    const shade = Math.max(0.22, Math.min(1.15, luminance / 235));
    const strength = Math.max(0.42, Math.min(0.9, (luminance - 125) / 125));

    data[index] = Math.round(
      data[index] * (1 - strength) + Math.min(255, color.r * shade) * strength
    );
    data[index + 1] = Math.round(
      data[index + 1] * (1 - strength) +
        Math.min(255, color.g * shade) * strength
    );
    data[index + 2] = Math.round(
      data[index + 2] * (1 - strength) +
        Math.min(255, color.b * shade) * strength
    );
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export default function ProductColorizedImage({
  src,
  productColorHex,
  ...props
}: ProductColorizedImageProps) {
  const [colorizedSrc, setColorizedSrc] = useState<string | null>(null);
  const color = parseHexColor(productColorHex);

  useEffect(() => {
    let cancelled = false;

    if (!color || isNearlyWhite(color)) {
      setColorizedSrc(null);
      return undefined;
    }

    void colorizeProductImage(src, color)
      .then(nextSrc => {
        if (!cancelled) {
          setColorizedSrc(nextSrc);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setColorizedSrc(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [color?.b, color?.g, color?.r, src]);

  return <AppImage src={colorizedSrc ?? src} {...props} />;
}
