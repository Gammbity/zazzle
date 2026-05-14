/**
 * Authoritative bounds / print-area math.
 *
 * No product geometry lives here – callers pass PrintArea from product config.
 * Every component that needs clamping or print-area rects should import from
 * this module instead of duplicating logic.
 */

import type { PrintArea } from '@/types/product';

// ---------------------------------------------------------------------------
// Rect primitives
// ---------------------------------------------------------------------------

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

/**
 * Convert a percentage-based PrintArea to an absolute pixel Rect.
 * All values in `area` are 0–100 percentages of the canvas dimensions.
 */
export function printAreaToRect(
  area: PrintArea,
  canvasWidth: number,
  canvasHeight: number
): Rect {
  return {
    x: (area.x / 100) * canvasWidth,
    y: (area.y / 100) * canvasHeight,
    width: (area.width / 100) * canvasWidth,
    height: (area.height / 100) * canvasHeight,
  };
}

/**
 * Return the optional safe-zone rect (inset within the print area).
 * Falls back to `printAreaToRect` when no safe-zone fields are defined.
 */
export function safeAreaToRect(
  area: PrintArea,
  canvasWidth: number,
  canvasHeight: number
): Rect {
  if (
    area.safeX !== undefined &&
    area.safeY !== undefined &&
    area.safeWidth !== undefined &&
    area.safeHeight !== undefined
  ) {
    return {
      x: (area.safeX / 100) * canvasWidth,
      y: (area.safeY / 100) * canvasHeight,
      width: (area.safeWidth / 100) * canvasWidth,
      height: (area.safeHeight / 100) * canvasHeight,
    };
  }
  return printAreaToRect(area, canvasWidth, canvasHeight);
}

// ---------------------------------------------------------------------------
// Clamping
// ---------------------------------------------------------------------------

/**
 * Clamp a layer's top-left position so its bounding box stays inside `bounds`.
 * `nodeWidth` / `nodeHeight` are the rendered pixel dimensions (width * scaleX etc.).
 */
export function clampPosition(
  pos: { x: number; y: number },
  nodeWidth: number,
  nodeHeight: number,
  bounds: Rect
): { x: number; y: number } {
  const minX =
    nodeWidth > bounds.width ? bounds.x + bounds.width - nodeWidth : bounds.x;
  const maxX =
    nodeWidth > bounds.width ? bounds.x : bounds.x + bounds.width - nodeWidth;
  const minY =
    nodeHeight > bounds.height
      ? bounds.y + bounds.height - nodeHeight
      : bounds.y;
  const maxY =
    nodeHeight > bounds.height
      ? bounds.y
      : bounds.y + bounds.height - nodeHeight;

  return {
    x: Math.min(Math.max(pos.x, minX), maxX),
    y: Math.min(Math.max(pos.y, minY), maxY),
  };
}

/**
 * Konva `boundBoxFunc` implementation – prevent a resize from pushing the
 * bounding box outside the print area and enforce a minimum size of 10px.
 */
export function constrainBox(
  oldBox: Rect & { rotation: number },
  newBox: Rect & { rotation: number },
  bounds: Rect
): Rect & { rotation: number } {
  if (newBox.width < 0 || newBox.height < 0) {
    return oldBox;
  }

  if (newBox.width < 10 || newBox.height < 10) return oldBox;

  const width = Math.min(newBox.width, bounds.width);
  const height = Math.min(newBox.height, bounds.height);
  const x = Math.min(
    Math.max(newBox.x, bounds.x),
    bounds.x + bounds.width - width
  );
  const y = Math.min(
    Math.max(newBox.y, bounds.y),
    bounds.y + bounds.height - height
  );

  return {
    ...newBox,
    x,
    y,
    width,
    height,
  };
}

// ---------------------------------------------------------------------------
// Centering helpers
// ---------------------------------------------------------------------------

/**
 * Calculate x/y to place an object (nodeW × nodeH) centred within `bounds`.
 */
export function centreInRect(
  nodeWidth: number,
  nodeHeight: number,
  bounds: Rect
): { x: number; y: number } {
  return {
    x: bounds.x + (bounds.width - nodeWidth) / 2,
    y: bounds.y + (bounds.height - nodeHeight) / 2,
  };
}
