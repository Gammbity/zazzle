/**
 * Export utilities.
 *
 * Thin wrappers over Konva's toDataURL so callers never import Konva directly
 * and DPI / coordinate-mapping can be extended here without touching components.
 */

import type Konva from 'konva';

// ---------------------------------------------------------------------------
// Safe padding for print-area crop exports
// ---------------------------------------------------------------------------

/**
 * Extra pixels (at pixelRatio=1) added to each edge of the crop rect when
 * exporting the design layer.  This prevents sub-pixel glyph overhang from
 * being clipped at the right/bottom edge of the print area.
 * Applied symmetrically so the renderer can compensate without visual shift.
 */
export const GLYPH_SAFE_PADDING = 8;

// ---------------------------------------------------------------------------
// Canvas export
// ---------------------------------------------------------------------------

/**
 * Export a single Konva Layer as a PNG Data-URL.
 *
 * When `printAreaRect` is provided the export is cropped to that rectangle
 * (expanded by GLYPH_SAFE_PADDING on every side so right/bottom-edge glyphs
 * are never cut).  Without it the entire layer is exported.
 *
 * The transformer is temporarily hidden so it is excluded from the output.
 */
export function exportLayerAsPng(
  designLayer: Konva.Layer,
  transformer?: Konva.Transformer | null,
  pixelRatio = 2,
  printAreaRect?: { x: number; y: number; width: number; height: number } | null
): string | null {
  if (!designLayer) return null;

  const wasVisible = transformer?.isVisible() ?? true;
  transformer?.visible(false);
  designLayer.batchDraw();

  const toDataUrlOpts: Parameters<typeof designLayer.toDataURL>[0] = {
    pixelRatio,
  };

  if (printAreaRect) {
    // Expand the crop rect by GLYPH_SAFE_PADDING on every side so glyph
    // overhang at any edge is captured without affecting the editor area.
    const pad = GLYPH_SAFE_PADDING;
    const stage = designLayer.getStage();
    const stageWidth = stage?.width();
    const stageHeight = stage?.height();
    const x = Math.max(0, printAreaRect.x - pad);
    const y = Math.max(0, printAreaRect.y - pad);
    const paddedWidth = printAreaRect.width + pad * 2;
    const paddedHeight = printAreaRect.height + pad * 2;

    toDataUrlOpts.x = x;
    toDataUrlOpts.y = y;
    toDataUrlOpts.width =
      stageWidth !== undefined
        ? Math.min(stageWidth - x, paddedWidth)
        : paddedWidth;
    toDataUrlOpts.height =
      stageHeight !== undefined
        ? Math.min(stageHeight - y, paddedHeight)
        : paddedHeight;
  }

  const url = designLayer.toDataURL(toDataUrlOpts);

  if (transformer && wasVisible) {
    transformer.visible(true);
    designLayer.batchDraw();
  }

  return url;
}

// ---------------------------------------------------------------------------
// DPI utilities
// ---------------------------------------------------------------------------

/**
 * Convert a canvas pixel measurement to a physical print pixel measurement.
 *
 * @param canvasPx   - distance in canvas pixels
 * @param previewDpi - DPI of the canvas preview (typically 72 or 96)
 * @param printDpi   - target print DPI (e.g. 300)
 */
export function toPrintPx(
  canvasPx: number,
  previewDpi: number,
  printDpi: number
): number {
  return Math.round((canvasPx / previewDpi) * printDpi);
}

/**
 * Map a canvas-space Rect to print-space dimensions.
 */
export function mapRectToPrint(
  rect: { x: number; y: number; width: number; height: number },
  previewDpi: number,
  printDpi: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: toPrintPx(rect.x, previewDpi, printDpi),
    y: toPrintPx(rect.y, previewDpi, printDpi),
    width: toPrintPx(rect.width, previewDpi, printDpi),
    height: toPrintPx(rect.height, previewDpi, printDpi),
  };
}
