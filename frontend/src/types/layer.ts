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
}

export const STICKER_ASSETS: StickerAsset[] = [
  { id: 'star', label: 'Star', src: '/stickers/star.png' },
  { id: 'heart', label: 'Heart', src: '/stickers/heart.png' },
  { id: 'fire', label: 'Fire', src: '/stickers/fire.png' },
  { id: 'smile', label: 'Smile', src: '/stickers/smile.png' },
  { id: 'thumbsup', label: 'Thumbs Up', src: '/stickers/thumbsup.png' },
  { id: 'lightning', label: 'Lightning', src: '/stickers/lightning.png' },
  { id: 'crown', label: 'Crown', src: '/stickers/crown.png' },
  { id: 'rocket', label: 'Rocket', src: '/stickers/rocket.png' },
  { id: 'rainbow', label: 'Rainbow', src: '/stickers/rainbow.png' },
  { id: 'check', label: 'Check', src: '/stickers/check.png' },
  { id: 'sparkle', label: 'Sparkle', src: '/stickers/sparkle.png' },
  { id: 'flower', label: 'Flower', src: '/stickers/flower.png' },
];
