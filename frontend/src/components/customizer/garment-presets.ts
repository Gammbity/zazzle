export type GarmentType = 't-shirt' | 'hoodie';
export type GarmentSide = 'front' | 'back';

export interface GarmentPrintArea {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface GarmentSideAsset {
  image: string;
  printArea: GarmentPrintArea;
  /**
   * Only transparent-background PNGs can be recolored with the CSS mask/blend
   * trick. The photographed front/back JPGs have an opaque gray backdrop, so
   * tinting them would tint the backdrop too - those sides keep their base color.
   */
  tintable: boolean;
}

const GARMENT_ASSETS: Record<GarmentType, Partial<Record<GarmentSide, GarmentSideAsset>>> = {
  't-shirt': {
    front: {
      image: '/generated/category-tshirt-v2-trimmed.png',
      // printArea is % of the stage box; the image is letterboxed inside it
      // (object-fit: contain), so these already account for that offset.
      // Reaches up near the collar and down near the hem while staying
      // clear of the sleeves (calibrated against the garment's own pixels).
      // Left inset now matches the right (33% each side, centered) and the
      // top sits further below the collar than before.
      printArea: { top: 25, left: 33, width: 34, height: 58.5 },
      tintable: true,
    },
    back: {
      image: '/products/t-shirt/back.jpg',
      printArea: { top: 26.8, left: 30, width: 40, height: 54.7 },
      tintable: false,
    },
  },
  hoodie: {
    front: {
      image: '/generated/hoodie.png',
      printArea: { top: 24, left: 36, width: 28, height: 42 },
      tintable: true,
    },
  },
};

export function getGarmentAsset(
  garment: GarmentType,
  side: GarmentSide
): GarmentSideAsset {
  return GARMENT_ASSETS[garment][side] ?? GARMENT_ASSETS[garment].front!;
}

export function garmentHasBack(garment: GarmentType): boolean {
  return Boolean(GARMENT_ASSETS[garment].back);
}

export interface GarmentColor {
  name: string;
  value: string;
}

export const GARMENT_COLORS: GarmentColor[] = [
  { name: 'Oq', value: '#ffffff' },
  { name: 'Qora', value: '#1a1a1a' },
  { name: 'Kulrang', value: '#9ca3af' },
  { name: "To'q ko'k", value: '#1e3a8a' },
  { name: 'Qizil', value: '#991b1b' },
  { name: 'Yashil', value: '#065f46' },
  { name: 'Sariq', value: '#eab308' },
  { name: 'Binafsha', value: '#7c3aed' },
];

export const GARMENT_STICKERS = [
  '⭐',
  '❤️',
  '🔥',
  '☕',
  '🐱',
  '🌹',
  '💻',
  '🚀',
  '🎨',
  '🎵',
  '🌈',
  '✨',
];

export const GARMENT_DEFAULT_TEXT = 'Tahrirlash uchun bosing';
export const GARMENT_DEFAULT_TEXT_FONT_SIZE = 40;
export const GARMENT_STICKER_FONT_SIZE = 60;
