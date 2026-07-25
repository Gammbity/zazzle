import type { GarmentCanvasSize, GarmentColor, GarmentSide, GarmentSideAsset, GarmentType } from '~/types/garment';

// Print-area sizes: real DTG guidelines (Printful/Printify) suggest a
// full-front design up to ~12"x16"-15"x18", but that number assumes ink on
// already-flat fabric. Here the design is DecalGeometry-projected onto an
// already-curved 3D mesh — sized to the DTG maximum, it overshoots the
// flat front torso panel and wraps/bends onto the sleeves at the shoulder
// seam once a design fills the card (the reported "chegaralardan o'tib
// ketibdi" / "bukilib sinyapti" bug). These boxes are pulled back so the
// decal's actual footprint stays inside the seams — the true boundary —
// even when a design fills the entire card.
//
// Every side carries its OWN `canvasSize` — the flat "Bosma hududi" card's
// real editing resolution — rather than a single shared constant. This is
// the one universal editor for every garment/side (same component, same
// interactions as the mug editor); the only thing that ever changes
// between them is this card's dimensions. Each `printArea` width:height
// ratio is kept proportional to its own `canvasSize` so the card is never
// stretched non-uniformly.
const GARMENT_ASSETS: Record<GarmentType, Partial<Record<GarmentSide, GarmentSideAsset>>> = {
  't-shirt': {
    front: {
      printArea: { top: 27, left: 31, width: 38, height: 43.5 },
      canvasSize: { width: 400, height: 460 },
    },
    back: {
      printArea: { top: 29, left: 32, width: 36, height: 42 },
      canvasSize: { width: 390, height: 450 },
    },
  },
  'hoodie': {
    front: {
      printArea: { top: 30, left: 37, width: 26, height: 29.5 },
      canvasSize: { width: 370, height: 420 },
    },
    back: {
      printArea: { top: 32, left: 36, width: 28, height: 32 },
      canvasSize: { width: 370, height: 420 },
    },
  },
};

export function getGarmentAsset(garment: GarmentType, side: GarmentSide): GarmentSideAsset {
  return GARMENT_ASSETS[garment][side] ?? GARMENT_ASSETS[garment].front!;
}

export function getGarmentCanvasSize(garment: GarmentType, side: GarmentSide): GarmentCanvasSize {
  return getGarmentAsset(garment, side).canvasSize;
}

export function garmentHasBack(garment: GarmentType): boolean {
  return Boolean(GARMENT_ASSETS[garment].back);
}

export const GARMENT_COLORS: GarmentColor[] = [
  { name: 'Oq', value: '#ffffff' },
  { name: 'Qora', value: '#1a1a1a' },
  { name: 'Kulrang', value: '#9ca3af' },
  { name: 'To\'q ko\'k', value: '#1e3a8a' },
  { name: 'Qizil', value: '#991b1b' },
  { name: 'Yashil', value: '#065f46' },
  { name: 'Sariq', value: '#eab308' },
  { name: 'Binafsha', value: '#7c3aed' },
];

export const GARMENT_STICKERS = ['⭐', '❤️', '🔥', '☕', '🐱', '🌹', '💻', '🚀', '🎨', '🎵', '🌈', '✨'];

export const GARMENT_DEFAULT_TEXT = 'Tahrirlash uchun bosing';
export const GARMENT_DEFAULT_TEXT_FONT_SIZE = 40;
export const GARMENT_STICKER_FONT_SIZE = 60;
