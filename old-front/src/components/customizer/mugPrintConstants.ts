// Shared mug print geometry constants.
// Keep 2D editor, 3D viewer, and preview renderer all aligned from one place.
//
// Physical reference: 11oz mug circumference ≈ 29.5 cm
// Canvas width (540px) represents the full printable wrap ≈ 29.5 cm
// → 1 cm ≈ 540 / 29.5 ≈ 18.3 px  → use 18px per cm

export const MUG_EDITOR_CANVAS_WIDTH = 540;
export const MUG_EDITOR_CANVAS_HEIGHT = 200;

/**
 * Minimum clearance from each handle attachment edge in canvas pixels.
 *
 * Physical requirement: 1 cm from handle zone on each side.
 * At 18.3 px/cm → 18 px per side.
 *
 * This constant is the single source of truth for:
 *   - PrintEditor.tsx  clip path + visual guide lines
 *   - Konva EditorPanel printableArea (converted to %)
 *   - Mug preview renderer overlayBox validation
 */
export const MUG_HANDLE_MARGIN_PX = 18; // 1 cm each side

export const MUG_HANDLE_MARGIN_CM_TEXT = '1';

/** Fraction of canvas width that is the handle exclusion zone (both sides). */
export const MUG_PRINT_GAP_RATIO =
  (MUG_HANDLE_MARGIN_PX * 2) / MUG_EDITOR_CANVAS_WIDTH;

/** Fraction of canvas width that is safe to print on. */
export const MUG_PRINT_COVERAGE = 1 - MUG_PRINT_GAP_RATIO;

/**
 * Safe print area as percentages of the editor canvas (0–100).
 * Used to drive catalog.ts printableArea for the Konva editor.
 *
 * x  = MUG_HANDLE_MARGIN_PX / MUG_EDITOR_CANVAS_WIDTH × 100
 * width = MUG_PRINT_COVERAGE × 100
 */
export const MUG_SAFE_ZONE_X_PCT =
  (MUG_HANDLE_MARGIN_PX / MUG_EDITOR_CANVAS_WIDTH) * 100; // ≈ 3.33 %
export const MUG_SAFE_ZONE_WIDTH_PCT = MUG_PRINT_COVERAGE * 100; // ≈ 93.33 %
