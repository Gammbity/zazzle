/**
 * Editor-level state types (draft, history, store shape).
 * Import layer types from `@/types/layer` and product types from `@/types/product`.
 */

import type { Layer } from './layer';

// ---------------------------------------------------------------------------
// Draft schema – versioned for forward-compatible hydration
// ---------------------------------------------------------------------------

/** All layers on one printable surface. */
export interface SurfaceState {
  /** Matches ProductSurface.id */
  id: string;
  layers: Layer[];
}

/**
 * Persisted draft schema.
 * `version` allows safe migrations when the schema changes.
 */
export interface EditorDraft {
  version: 1;
  productId: string;
  activeSurfaceId: string;
  surfaces: SurfaceState[];
  updatedAt: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

/**
 * One snapshot in the undo/redo stack.
 * Stores only the surfaces array (immutable snapshots via spread).
 */
export interface HistoryEntry {
  surfaces: SurfaceState[];
}

// ---------------------------------------------------------------------------
// Editor store shape (mirrored in editorStore.ts)
// ---------------------------------------------------------------------------

export interface EditorState {
  productId: string;
  surfaces: SurfaceState[];
  activeSurfaceId: string;
  selectedLayerId: string | null;
  isDraftLoaded: boolean;
  history: HistoryEntry[];
  historyIndex: number;
}
