/**
 * Editor data model types for the Zazzle design canvas.
 *
 * These are client-only types; they map 1-to-1 with the future
 * Django `Draft` model and will be serialised to localStorage
 * until the backend API is wired up.
 */

// ---------------------------------------------------------------------------
// Layer types
// ---------------------------------------------------------------------------

export type LayerType = 'image' | 'text' | 'sticker';

/** Properties shared by every layer. */
export interface LayerBase {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  /** z-order — higher = on top */
  zIndex: number;
  visible: boolean;
  name: string;
}

/** A user-uploaded raster image layer. */
export interface ImageLayer extends LayerBase {
  type: 'image';
  /** Object URL or data-URL of the uploaded file. */
  src: string;
}

/** An editable text layer. */
export interface TextLayer extends LayerBase {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: '' | 'bold' | 'italic' | 'bold italic';
  fill: string;
  align: 'left' | 'center' | 'right';
}

/** A sticker (pre-made image asset) layer. */
export interface StickerLayer extends LayerBase {
  type: 'sticker';
  /** Path relative to /public, e.g. "/stickers/star.png" */
  src: string;
  stickerId: string;
}

export type Layer = ImageLayer | TextLayer | StickerLayer;

// ---------------------------------------------------------------------------
// Draft state
// ---------------------------------------------------------------------------

export interface AngleState {
  layers: Layer[];
  selectedId: string | null;
}

export interface DraftState {
  productSlug: string;
  selectedAngle: string;

  // New multi-angle format
  angleStates?: Record<string, AngleState>;

  // Legacy single-angle format (for migration compatibility)
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  updatedAt: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// Undo / Redo
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  layers: Layer[];
}

export interface HistoryState {
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];
}

// ---------------------------------------------------------------------------
// API stubs (future backend integration)
// ---------------------------------------------------------------------------

/** POST /api/drafts – create a new draft */
export interface CreateDraftRequest {
  productSlug: string;
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
}

/** PATCH /api/drafts/{id} – update an existing draft */
export interface UpdateDraftRequest {
  layers?: Layer[];
  canvasWidth?: number;
  canvasHeight?: number;
}

/** POST /api/drafts/{id}/render-preview – request a server-side render */
export interface RenderPreviewRequest {
  draftId: string;
}

export interface RenderPreviewResponse {
  previewUrl: string;
}

// ---------------------------------------------------------------------------
// Sticker definition
// ---------------------------------------------------------------------------

export interface StickerAsset {
  id: string;
  label: string;
  src: string; // e.g. "/stickers/star.png"
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

// ---------------------------------------------------------------------------
// Font options
// ---------------------------------------------------------------------------

export const FONT_FAMILIES = [
  'Inter',
  'Arial',
  'Roboto',
  'Georgia',
  'Courier New',
] as const;
export type FontFamily = (typeof FONT_FAMILIES)[number];
