/**
 * Product surface + print-area types.
 * Generic editor components import from here; product geometry lives in config only.
 */

/** Print-safe rectangle, expressed as **percentage** of the canvas dimensions. */
export interface PrintArea {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Optional safe-zone padding inside the print area (percentage). */
  safeX?: number;
  safeY?: number;
  safeWidth?: number;
  safeHeight?: number;
  /** Suggested initial scale when placing a new layer on this surface. */
  defaultScale?: number;
  /** Suggested initial rotation in degrees. */
  defaultRotation?: number;
}

/** One printable face / side of a physical product. */
export interface ProductSurface {
  /** Stable identifier, e.g. "front", "back", "wrap". */
  id: string;
  /** Human-readable tab label */
  label: string;
  /** Path to the base preview image, relative to /public */
  previewSrc: string;
  /** Alt text for the preview image */
  previewAlt: string;
  /**
   * Print-safe area for this surface, expressed as **% of the editor canvas**.
   * Used by the flat editor to position/constrain layers.
   * DO NOT use this to position the design on the product photo — use previewBox.
   */
  printArea: PrintArea;
  /** Recommended canvas aspect ratio (width / height) */
  canvasAspect: number;
  /**
   * Design placement box for the product preview image, expressed as
   * **% of the base product photo dimensions**.
   *
   * This is different from printArea when the editor canvas and the product
   * photo have different aspect ratios (e.g. the mug editor canvas is 1.40
   * but the mug photograph is roughly square).
   *
   * If omitted, the preview renderer falls back to printArea (which works
   * when canvas and photo share the same aspect ratio).
   */
  previewBox?: { x: number; y: number; width: number; height: number };
  /**
   * Target print dimensions in pixels at the intended print DPI.
   * Used for export coordinate mapping. Optional for MVP.
   */
  exportWidth?: number;
  exportHeight?: number;
  exportDpi?: number;
}

/** Lightweight product descriptor understood by the editor. */
export interface ProductConfig {
  /** Matches the URL slug */
  id: string;
  name: string;
  surfaces: ProductSurface[];
  /** Which surface id is shown by default */
  defaultSurfaceId: string;
}
