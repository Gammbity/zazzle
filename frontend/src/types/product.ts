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
  /** Print-safe area for this surface */
  printArea: PrintArea;
  /** Recommended canvas aspect ratio (width / height) */
  canvasAspect: number;
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
