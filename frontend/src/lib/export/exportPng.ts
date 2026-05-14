/**
 * exportPng.ts
 * ────────────
 * Clean export functionality for generating high-quality PNG files
 * from the editor canvas and design layers.
 */

import type { Layer } from '@/lib/editor/types';
import type { ProductAngle, PrintableArea } from '@/lib/products/catalog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportOptions {
  /** Output resolution multiplier (1 = canvas size, 2 = 2x, etc.) */
  scale?: number;
  /** Background color for the mockup export (default: transparent) */
  backgroundColor?: string;
  /** Image format quality for JPEG exports (0-1, default: 0.9) */
  quality?: number;
  /** Output format */
  format?: 'png' | 'jpeg';
}

interface MockupExportOptions extends ExportOptions {
  /** Product angle data */
  angle: ProductAngle;
  /** Canvas dimensions */
  canvasWidth: number;
  canvasHeight: number;
}

interface DesignExportOptions extends ExportOptions {
  /** Printable area bounds */
  printableArea: PrintableArea;
  /** Canvas dimensions */
  canvasWidth: number;
  canvasHeight: number;
}

// ---------------------------------------------------------------------------
// Canvas utilities
// ---------------------------------------------------------------------------

/**
 * Load an image from URL/data-URL and return HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // For CORS if needed
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Draw a text layer onto canvas context.
 */
function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: Extract<Layer, { type: 'text' }>,
  scale: number
) {
  ctx.save();

  // Apply transforms
  ctx.globalAlpha = layer.opacity;
  ctx.translate(layer.x * scale, layer.y * scale);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.scale(layer.scaleX, layer.scaleY);

  // Set font properties
  const fontSize = layer.fontSize * scale;
  const fontStyle = layer.fontStyle.includes('italic') ? 'italic' : 'normal';
  const fontWeight = layer.fontStyle.includes('bold') ? 'bold' : 'normal';
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${layer.fontFamily}`;
  ctx.fillStyle = layer.fill;
  ctx.textAlign = layer.align as CanvasTextAlign;
  ctx.textBaseline = 'top';

  // Draw text (handle multiline)
  const lines = layer.text.split('\n');
  const lineHeight = fontSize * 1.2;

  lines.forEach((line, i) => {
    const y = i * lineHeight;
    ctx.fillText(line, 0, y);
  });

  ctx.restore();
}

/**
 * Draw an image layer onto canvas context.
 */
async function drawImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: Extract<Layer, { type: 'image' | 'sticker' }>,
  scale: number
) {
  try {
    const img = await loadImage(layer.src);

    ctx.save();

    // Apply transforms
    ctx.globalAlpha = layer.opacity;
    ctx.translate(layer.x * scale, layer.y * scale);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.scaleX, layer.scaleY);

    // Draw image
    ctx.drawImage(img, 0, 0, layer.width * scale, layer.height * scale);

    ctx.restore();
  } catch (error) {
    console.warn(`Failed to draw image layer ${layer.id}:`, error);
  }
}

// ---------------------------------------------------------------------------
// Export functions
// ---------------------------------------------------------------------------

/**
 * Export the complete mockup (product image + design layers) as PNG.
 * This creates a composite image showing the design on the product.
 */
export async function exportMockup(
  layers: Layer[],
  options: MockupExportOptions
): Promise<string> {
  const {
    angle,
    canvasWidth,
    canvasHeight,
    scale = 2,
    backgroundColor = 'transparent',
    format = 'png',
    quality = 0.9,
  } = options;

  // Create high-resolution canvas
  const outputWidth = Math.round(canvasWidth * scale);
  const outputHeight = Math.round(canvasHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set background
  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, outputWidth, outputHeight);
  }

  try {
    // Draw product background image
    const productImg = await loadImage(angle.src);
    ctx.drawImage(productImg, 0, 0, outputWidth, outputHeight);

    // Draw overlay area bounds (for debugging - comment out for production)
    if (angle.overlayBox && process.env.NODE_ENV === 'development') {
      const overlayX = (angle.overlayBox.x / 100) * outputWidth;
      const overlayY = (angle.overlayBox.y / 100) * outputHeight;
      const overlayW = (angle.overlayBox.width / 100) * outputWidth;
      const overlayH = (angle.overlayBox.height / 100) * outputHeight;

      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = 'red';
      ctx.fillRect(overlayX, overlayY, overlayW, overlayH);
      ctx.restore();
    }

    // Draw design layers (sorted by zIndex)
    const sortedLayers = [...layers]
      .filter(l => l.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      if (layer.type === 'text') {
        drawTextLayer(ctx, layer, scale);
      } else if (layer.type === 'image' || layer.type === 'sticker') {
        await drawImageLayer(ctx, layer, scale);
      }
    }

    // Export as data URL
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    return canvas.toDataURL(mimeType, quality);
  } catch (error) {
    console.error('Failed to export mockup:', error);
    throw error;
  }
}

/**
 * Export only the design layers (no product background) for printing.
 * Creates a transparent PNG with just the user's design at high resolution.
 */
export async function exportDesignOnly(
  layers: Layer[],
  options: DesignExportOptions
): Promise<string> {
  const {
    printableArea,
    canvasWidth,
    canvasHeight,
    scale = 3,
    format = 'png',
    quality = 1.0,
  } = options;

  // Calculate printable area bounds in canvas coordinates
  const printX = (printableArea.x / 100) * canvasWidth;
  const printY = (printableArea.y / 100) * canvasHeight;
  const printW = (printableArea.width / 100) * canvasWidth;
  const printH = (printableArea.height / 100) * canvasHeight;

  // Create high-resolution canvas for printable area only
  const outputWidth = Math.round(printW * scale);
  const outputHeight = Math.round(printH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Transparent background for print-ready file
  ctx.clearRect(0, 0, outputWidth, outputHeight);

  try {
    // Translate context to offset for printable area
    ctx.save();
    ctx.translate(-printX * scale, -printY * scale);

    // Draw design layers (sorted by zIndex), clipped to printable area
    const sortedLayers = [...layers]
      .filter(l => l.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    // Set clipping region to printable area
    ctx.beginPath();
    ctx.rect(printX * scale, printY * scale, printW * scale, printH * scale);
    ctx.clip();

    for (const layer of sortedLayers) {
      if (layer.type === 'text') {
        drawTextLayer(ctx, layer, scale);
      } else if (layer.type === 'image' || layer.type === 'sticker') {
        await drawImageLayer(ctx, layer, scale);
      }
    }

    ctx.restore();

    // Export as data URL
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    return canvas.toDataURL(mimeType, quality);
  } catch (error) {
    console.error('Failed to export design:', error);
    throw error;
  }
}

/**
 * Utility function to download a data URL as a file.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate a sensible filename for exports.
 */
export function generateFilename({
  productSlug,
  angleId,
  variant,
  format = 'png',
}: {
  productSlug: string;
  angleId: string;
  variant: 'mockup' | 'design';
  format?: 'png' | 'jpeg';
}): string {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${productSlug}-${angleId}-${variant}-${timestamp}.${format}`;
}
