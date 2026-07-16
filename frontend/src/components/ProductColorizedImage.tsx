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

// A generic "is this pixel roughly neutral gray" test isn't enough to find the
// backdrop: studio product photos often shade the backdrop only slightly
// darker than the (also neutral, off-white) product itself, so both pass the
// same luminance/spread cutoff and the flood fill swallows the whole product.
// Instead we sample the actual border color and require a pixel to be close
// to *that specific* color to count as background.
const BACKGROUND_COLOR_TOLERANCE = 40;

function colorDistance(
  data: Uint8ClampedArray,
  index: number,
  ref: Rgb
): number {
  const dr = data[index] - ref.r;
  const dg = data[index + 1] - ref.g;
  const db = data[index + 2] - ref.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function estimateBackgroundColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  const accumulate = (pixelIndex: number) => {
    const index = pixelIndex * 4;
    if (data[index + 3] <= 12) return;
    r += data[index];
    g += data[index + 1];
    b += data[index + 2];
    count += 1;
  };

  for (let x = 0; x < width; x += 1) {
    accumulate(x);
    accumulate((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    accumulate(y * width);
    accumulate(y * width + width - 1);
  }

  if (!count) return { r: 255, g: 255, b: 255 };
  return { r: r / count, g: g / count, b: b / count };
}

function isBackgroundCandidate(
  data: Uint8ClampedArray,
  pixelIndex: number,
  backgroundColor: Rgb
): boolean {
  const index = pixelIndex * 4;
  const alpha = data[index + 3];
  return (
    alpha <= 12 ||
    colorDistance(data, index, backgroundColor) < BACKGROUND_COLOR_TOLERANCE
  );
}

function markEdgeConnectedBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Uint8Array {
  const backgroundColor = estimateBackgroundColor(data, width, height);
  const background = new Uint8Array(width * height);
  const queue: number[] = [];

  const push = (pixelIndex: number) => {
    if (
      background[pixelIndex] ||
      !isBackgroundCandidate(data, pixelIndex, backgroundColor)
    ) {
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
