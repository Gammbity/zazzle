/**
 * Canonical layer types for the Zazzle design editor.
 * Single source of truth – import from here, not from lib/editor/types.
 */

export type LayerType = 'image' | 'text' | 'sticker';

export interface BaseLayer {
  /** Unique, stable identifier – never reassigned after creation */
  id: string;
  type: LayerType;
  /** Human-readable display name in the layer list */
  name: string;
  x: number;
  y: number;
  /** Intrinsic width before scale */
  width: number;
  /** Intrinsic height before scale */
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  /** Higher = closer to viewer */
  zIndex: number;
  visible: boolean;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  /** data-URL or public-asset URL */
  src: string;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: '' | 'bold' | 'italic' | 'bold italic';
  fill: string;
  align: 'left' | 'center' | 'right';
}

export interface StickerLayer extends BaseLayer {
  type: 'sticker';
  stickerId: string;
  src: string;
}

export type Layer = ImageLayer | TextLayer | StickerLayer;

// ---------------------------------------------------------------------------
// Font helpers
// ---------------------------------------------------------------------------

export const FONT_FAMILIES = [
  'Inter',
  'Arial',
  'Roboto',
  'Georgia',
  'Courier New',
] as const;

export type FontFamily = (typeof FONT_FAMILIES)[number];

// ---------------------------------------------------------------------------
// Sticker assets
// ---------------------------------------------------------------------------

export interface StickerAsset {
  id: string;
  label: string;
  src: string;
  description: string;
}

export const STICKER_ASSETS: StickerAsset[] = [
  {
    id: 'star',
    label: 'Yulduz',
    src: '/stickers/star.png',
    description: "Bayramona va yorqin urg'u uchun.",
  },
  {
    id: 'heart',
    label: 'Yurak',
    src: '/stickers/heart.png',
    description: "Sovg'a va iliq dizaynlar uchun mos.",
  },
  {
    id: 'fire',
    label: 'Olov',
    src: '/stickers/fire.png',
    description: 'Energiya va kuchli kayfiyat beradi.',
  },
  {
    id: 'smile',
    label: 'Tabassum',
    src: '/stickers/smile.png',
    description: "Yengil va quvnoq ko'rinish yaratadi.",
  },
  {
    id: 'thumbsup',
    label: 'Bosh barmoq',
    src: '/stickers/thumbsup.png',
    description: 'Tasdiq va ijobiy signal sifatida ishlaydi.',
  },
  {
    id: 'lightning',
    label: 'Chaqmoq',
    src: '/stickers/lightning.png',
    description: 'Tezlik va dinamika hissini kuchaytiradi.',
  },
  {
    id: 'crown',
    label: 'Toj',
    src: '/stickers/crown.png',
    description: "Premium yoki g'olibona kayfiyat uchun.",
  },
  {
    id: 'rocket',
    label: 'Raketa',
    src: '/stickers/rocket.png',
    description: "Startap, o'sish va tezlanish mavzusiga mos.",
  },
  {
    id: 'rainbow',
    label: 'Kamalak',
    src: '/stickers/rainbow.png',
    description: "Rang-barang va iliq kompozitsiyalar uchun.",
  },
  {
    id: 'check',
    label: 'Tasdiq',
    src: '/stickers/check.png',
    description: 'Ishonchli va tasdiqlangan bloklarga mos.',
  },
  {
    id: 'sparkle',
    label: 'Yaltirash',
    src: '/stickers/sparkle.png',
    description: 'Toza va yorqin bezak sifatida ishlaydi.',
  },
  {
    id: 'flower',
    label: 'Gul',
    src: '/stickers/flower.png',
    description: 'Nozik va estetik dizaynlar uchun tanlov.',
  },
];
