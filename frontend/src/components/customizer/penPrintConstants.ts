// Shared pen print geometry constants.
// Physical reference: standard promo pen printable barrel length ~= 15 cm.

// Editor canvas tuned for pen wrap editing.
export const PEN_EDITOR_CANVAS_WIDTH = 640;

// Keep 1 cm unprinted margin on both ends of the barrel.
export const PEN_END_MARGIN_CM = 1;
export const PEN_PRINTABLE_LENGTH_CM = 15;

export const PEN_SIDE_MARGIN_RATIO =
  PEN_END_MARGIN_CM / PEN_PRINTABLE_LENGTH_CM;
export const PEN_PRINT_COVERAGE = 1 - PEN_SIDE_MARGIN_RATIO * 2;

// Catalog print-area percentages for pen.
export const PEN_SAFE_ZONE_X_PCT = PEN_SIDE_MARGIN_RATIO * 100; // ~= 6.67%
export const PEN_SAFE_ZONE_WIDTH_PCT = PEN_PRINT_COVERAGE * 100; // ~= 86.67%

// Pen barrel print should cover the full vertical band.
export const PEN_SAFE_ZONE_Y_PCT = 0;
export const PEN_SAFE_ZONE_HEIGHT_PCT = 100;