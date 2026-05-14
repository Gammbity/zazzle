/**
 * Pure print-area geometry helpers.
 *
 * All functions are pure (no side-effects, no imports from React or Konva).
 * Import and use wherever bounds math is needed.
 */

import type { PrintArea, ProductSurface } from '@/types/product';
import {
  printAreaToRect,
  clampPosition,
  constrainBox,
  centreInRect,
} from '@/lib/editor/bounds';
import { GLYPH_SAFE_PADDING } from '@/lib/editor/export';

// Re-export so components can import from one place
export { printAreaToRect, clampPosition, constrainBox, centreInRect };
export type { Rect } from '@/lib/editor/bounds';
export { GLYPH_SAFE_PADDING };

/**
 * Compute the initial position for a new layer dropped onto a surface.
 * Centres the layer inside the print area.
 */
export function getDefaultLayerPosition(
  printArea: PrintArea,
  canvasWidth: number,
  canvasHeight: number,
  layerWidth: number,
  layerHeight: number
): { x: number; y: number } {
  const rect = printAreaToRect(printArea, canvasWidth, canvasHeight);
  return centreInRect(layerWidth, layerHeight, rect);
}

/**
 * Compute the scale that fits a layer (w × h) inside the print area
 * at `fillFraction` of the available space (default 0.8 = 80%).
 */
export function fitLayerScale(
  printArea: PrintArea,
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
  fillFraction = 0.8
): number {
  const rect = printAreaToRect(printArea, canvasWidth, canvasHeight);
  const maxW = rect.width * fillFraction;
  const maxH = rect.height * fillFraction;
  return Math.min(maxW / imageWidth, maxH / imageHeight);
}

// ---------------------------------------------------------------------------
// Preview bridge helpers
// ---------------------------------------------------------------------------

/**
 * Pixel-precise design box for rendering a design onto a product base image.
 *
 * Converts the percentage-based PrintArea config (used by the flat editor)
 * into absolute pixel coordinates on the base product photo.  This is the
 * single source of truth that BOTH the flat editor clip rect AND the
 * preview renderer must derive their geometry from.
 *
 * All rounding uses Math.ceil for width/height so the right and bottom
 * edges are never truncated.
 *
 * @param printArea   - from ProductSurface.printArea (same object the editor uses)
 * @param imageWidth  - naturalWidth of the product base photo
 * @param imageHeight - naturalHeight of the product base photo
 * @returns { x, y, w, h } in image pixels
 */
export function mapPrintAreaToImageRect(
  printArea: PrintArea,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; w: number; h: number } {
  return {
    x: Math.round((printArea.x / 100) * imageWidth),
    y: Math.round((printArea.y / 100) * imageHeight),
    // ceil so right/bottom glyph pixels are never truncated by floor rounding
    w: Math.ceil((printArea.width / 100) * imageWidth),
    h: Math.ceil((printArea.height / 100) * imageHeight),
  };
}

/**
 * Expand a design render box symmetrically by `safePixels` on all sides.
 *
 * This keeps the left/right and top/bottom margins visually balanced while
 * still preserving extra room for glyph overhang near the edges.
 */
export function applyPreviewPadding(
  box: { x: number; y: number; w: number; h: number },
  safePixels: number
): { x: number; y: number; w: number; h: number } {
  return {
    x: box.x - safePixels,
    y: box.y - safePixels,
    w: box.w + safePixels * 2,
    h: box.h + safePixels * 2,
  };
}

/**
 * Convenience: derive the preview render box from a PrintArea in one call.
 * Returns a box expanded by GLYPH_SAFE_PADDING on every side so edge glyphs
 * are never clipped.
 */
export function getPreviewRect(
  printArea: PrintArea,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; w: number; h: number } {
  const base = mapPrintAreaToImageRect(printArea, imageWidth, imageHeight);
  return applyPreviewPadding(base, GLYPH_SAFE_PADDING);
}

/**
 * The canonical function for computing the design box used by preview renderers.
 *
 * Uses `surface.previewBox` (photo-space percentages, from the catalog's
 * overlayBox) when available, because the editor-canvas aspect ratio and
 * the product photo aspect ratio are often different.
 *
 * Falls back to `surface.printArea` only when no previewBox is configured
 * (safe for products where canvas and photo share the same aspect ratio).
 *
 * Always applies GLYPH_SAFE_PADDING so edge glyphs are never clipped.
 *
 * @param surface    - ProductSurface from getProductSurface()
 * @param imageWidth  - naturalWidth of the product base photo
 * @param imageHeight - naturalHeight of the product base photo
 */
export function getPreviewRectFromSurface(
  surface: ProductSurface,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; w: number; h: number } {
  // Prefer previewBox (photo-space) over printArea (editor-canvas-space).
  const box = surface.previewBox ?? surface.printArea;
  return getPreviewRect(box, imageWidth, imageHeight);
}
