/**
 * editorStore.ts – centralised editor state via Zustand.
 *
 * Architecture rules:
 *  - Components read state and call actions from this store only.
 *  - No component should contain local `useState` for layers / history.
 *  - All draft I/O goes through draftStorage (never touches IndexedDB here).
 *  - History entries are NOT created during drag/scaling (only on commit).
 *
 * Actions available:
 *   addLayer, updateLayer, updateLayerCommit, deleteLayer, duplicateLayer,
 *   selectLayer, reorderLayer, setActiveSurface,
 *   hydrateDraft, resetDraft,
 *   undo, redo
 */

import { create } from 'zustand';
import {
  uid,
  normaliseZIndexes,
  bringForward,
  sendBackward,
} from '@/lib/editor/serialize';
import {
  saveDraft,
  loadDraft,
  deleteDraft,
  createEmptyDraft,
} from '@/lib/storage/draftStorage';
import { getProductSurfaces } from '@/lib/products/surfaces';
import type { Layer } from '@/types/layer';
import type { EditorDraft, SurfaceState, HistoryEntry } from '@/types/editor';

const MAX_HISTORY = 60;

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface EditorStore {
  // ── State ────────────────────────────────────────────────────────────
  productId: string;
  surfaces: SurfaceState[];
  activeSurfaceId: string;
  selectedLayerId: string | null;
  isDraftLoaded: boolean;

  /** Full undo/redo stack. Points to "current" state. */
  history: HistoryEntry[];
  historyIndex: number;

  // ── Layer actions ─────────────────────────────────────────────────────
  /**
   * Add a new layer to the active surface and push a history entry.
   * Automatically normalises zIndexes.
   */
  addLayer: (layer: Omit<Layer, 'id' | 'zIndex'>) => string;

  /**
   * Update layer attributes WITHOUT creating a history entry.
   * Use for live drag / transform feedback.
   */
  updateLayer: (layerId: string, attrs: Partial<Layer>) => void;

  /**
   * Commit a finalised transform/drag to the history stack.
   * Call this in onDragEnd / onTransformEnd handlers.
   */
  updateLayerCommit: (layerId: string, attrs: Partial<Layer>) => void;

  deleteLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  selectLayer: (layerId: string | null) => void;

  /** Move a layer one step forward (higher zIndex). */
  bringLayerForward: (layerId: string) => void;
  /** Move a layer one step backward (lower zIndex). */
  sendLayerBackward: (layerId: string) => void;

  setActiveSurface: (surfaceId: string) => void;

  // ── Draft I/O ─────────────────────────────────────────────────────────
  /**
   * Load draft from IndexedDB and populate the store.
   * Must be called once on editor mount. Idempotent after first load.
   */
  hydrateDraft: (productId: string) => Promise<void>;

  /**
   * Persist the current state to IndexedDB.
   * Should be called from a debounced effect in the UI.
   */
  persistDraft: () => Promise<void>;

  /** Clear all surfaces and reset undo history. */
  resetDraft: () => void;

  // ── History ───────────────────────────────────────────────────────────
  undo: () => void;
  redo: () => void;

  // ── Internal ──────────────────────────────────────────────────────────
  _pushHistory: (surfaces: SurfaceState[]) => void;
  _updateSurface: (surfaceId: string, layers: Layer[]) => SurfaceState[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getActiveLayers(
  surfaces: SurfaceState[],
  activeSurfaceId: string
): Layer[] {
  return surfaces.find(s => s.id === activeSurfaceId)?.layers ?? [];
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useEditorStore = create<EditorStore>((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  productId: '',
  surfaces: [],
  activeSurfaceId: '',
  selectedLayerId: null,
  isDraftLoaded: false,
  history: [],
  historyIndex: -1,

  // ── Internal helpers ─────────────────────────────────────────────────────

  _updateSurface(surfaceId, layers) {
    return get().surfaces.map(s => (s.id === surfaceId ? { ...s, layers } : s));
  },

  _pushHistory(surfaces) {
    set(state => {
      const trimmed = state.history.slice(0, state.historyIndex + 1);
      const next = [...trimmed, { surfaces }];
      if (next.length > MAX_HISTORY) next.shift();
      return {
        history: next,
        historyIndex: Math.min(next.length - 1, MAX_HISTORY - 1),
      };
    });
  },

  // ── Layer actions ─────────────────────────────────────────────────────────

  addLayer(layerPartial) {
    const state = get();
    const existing = getActiveLayers(state.surfaces, state.activeSurfaceId);
    const id = uid();
    const newLayer = {
      ...layerPartial,
      id,
      zIndex: existing.length,
    } as Layer;

    const newLayers = normaliseZIndexes([...existing, newLayer]);
    const newSurfaces = state._updateSurface(state.activeSurfaceId, newLayers);

    set({ surfaces: newSurfaces, selectedLayerId: id });
    get()._pushHistory(newSurfaces);
    return id;
  },

  updateLayer(layerId, attrs) {
    // Live update – no history entry
    const state = get();
    const layers = getActiveLayers(state.surfaces, state.activeSurfaceId);
    const newLayers = layers.map(l =>
      l.id === layerId ? ({ ...l, ...attrs } as Layer) : l
    );
    set({ surfaces: state._updateSurface(state.activeSurfaceId, newLayers) });
  },

  updateLayerCommit(layerId, attrs) {
    // Final commit (drag end / transform end) – write history
    const state = get();
    const layers = getActiveLayers(state.surfaces, state.activeSurfaceId);
    const newLayers = layers.map(l =>
      l.id === layerId ? ({ ...l, ...attrs } as Layer) : l
    );
    const newSurfaces = state._updateSurface(state.activeSurfaceId, newLayers);
    set({ surfaces: newSurfaces });
    get()._pushHistory(newSurfaces);
  },

  deleteLayer(layerId) {
    const state = get();
    const layers = getActiveLayers(state.surfaces, state.activeSurfaceId);
    const filtered = normaliseZIndexes(layers.filter(l => l.id !== layerId));
    const newSurfaces = state._updateSurface(state.activeSurfaceId, filtered);
    set({
      surfaces: newSurfaces,
      selectedLayerId:
        state.selectedLayerId === layerId ? null : state.selectedLayerId,
    });
    get()._pushHistory(newSurfaces);
  },

  duplicateLayer(layerId) {
    const state = get();
    const layers = getActiveLayers(state.surfaces, state.activeSurfaceId);
    const original = layers.find(l => l.id === layerId);
    if (!original) return;

    const clone: Layer = {
      ...original,
      id: uid(),
      x: original.x + 20,
      y: original.y + 20,
      zIndex: layers.length,
    };
    const newLayers = normaliseZIndexes([...layers, clone]);
    const newSurfaces = state._updateSurface(state.activeSurfaceId, newLayers);
    set({ surfaces: newSurfaces, selectedLayerId: clone.id });
    get()._pushHistory(newSurfaces);
  },

  selectLayer(layerId) {
    set({ selectedLayerId: layerId });
  },

  bringLayerForward(layerId) {
    const state = get();
    const layers = getActiveLayers(state.surfaces, state.activeSurfaceId);
    const newLayers = bringForward(layers, layerId);
    const newSurfaces = state._updateSurface(state.activeSurfaceId, newLayers);
    set({ surfaces: newSurfaces });
    get()._pushHistory(newSurfaces);
  },

  sendLayerBackward(layerId) {
    const state = get();
    const layers = getActiveLayers(state.surfaces, state.activeSurfaceId);
    const newLayers = sendBackward(layers, layerId);
    const newSurfaces = state._updateSurface(state.activeSurfaceId, newLayers);
    set({ surfaces: newSurfaces });
    get()._pushHistory(newSurfaces);
  },

  setActiveSurface(surfaceId) {
    set({ activeSurfaceId: surfaceId, selectedLayerId: null });
  },

  // ── Draft I/O ─────────────────────────────────────────────────────────────

  async hydrateDraft(productId) {
    const state = get();
    if (state.isDraftLoaded && state.productId === productId) return;

    const productSurfaces = getProductSurfaces(productId);
    const surfaceIds = productSurfaces.map(s => s.id);
    const defaultSurfaceId = surfaceIds[0] ?? 'front';

    const draft = await loadDraft(productId);

    if (draft) {
      // Merge: keep any surfaces from config that are missing in the draft
      // (handles new surface being added to a product after draft was saved)
      const mergedSurfaces: SurfaceState[] = surfaceIds.map(id => {
        const saved = draft.surfaces.find(s => s.id === id);
        return saved ?? { id, layers: [] };
      });

      const activeSurfaceId = mergedSurfaces.find(
        s => s.id === draft.activeSurfaceId
      )
        ? draft.activeSurfaceId
        : defaultSurfaceId;

      set({
        productId,
        surfaces: mergedSurfaces,
        activeSurfaceId,
        isDraftLoaded: true,
        history: [{ surfaces: mergedSurfaces }],
        historyIndex: 0,
      });
    } else {
      const empty = createEmptyDraft(productId, surfaceIds);
      set({
        productId,
        surfaces: empty.surfaces,
        activeSurfaceId: empty.activeSurfaceId,
        isDraftLoaded: true,
        history: [{ surfaces: empty.surfaces }],
        historyIndex: 0,
      });
    }
  },

  async persistDraft() {
    const state = get();
    if (!state.isDraftLoaded) return; // never overwrite before initial load
    const draft: EditorDraft = {
      version: 1,
      productId: state.productId,
      activeSurfaceId: state.activeSurfaceId,
      surfaces: state.surfaces,
      updatedAt: new Date().toISOString(),
    };
    await saveDraft(draft);
  },

  resetDraft() {
    const state = get();
    const productSurfaces = getProductSurfaces(state.productId);
    const surfaceIds = productSurfaces.map(s => s.id);
    const empty = createEmptyDraft(state.productId, surfaceIds);
    const emptySurfaces = empty.surfaces;
    deleteDraft(state.productId).catch(console.warn);
    set({
      surfaces: emptySurfaces,
      selectedLayerId: null,
      history: [{ surfaces: emptySurfaces }],
      historyIndex: 0,
    });
  },

  // ── History ───────────────────────────────────────────────────────────────

  undo() {
    const state = get();
    if (state.historyIndex <= 0) return;
    const newIdx = state.historyIndex - 1;
    const entry = state.history[newIdx];
    if (!entry) return;
    set({ historyIndex: newIdx, surfaces: entry.surfaces });
  },

  redo() {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    const newIdx = state.historyIndex + 1;
    const entry = state.history[newIdx];
    if (!entry) return;
    set({ historyIndex: newIdx, surfaces: entry.surfaces });
  },
}));

// ---------------------------------------------------------------------------
// Derived selectors (use in components)
// ---------------------------------------------------------------------------

/** Returns layers for the currently active surface. */
export function useActiveLayers(): Layer[] {
  return useEditorStore(s => getActiveLayers(s.surfaces, s.activeSurfaceId));
}

/** Returns the currently selected layer, or null. */
export function useSelectedLayer(): Layer | null {
  return useEditorStore(s => {
    if (!s.selectedLayerId) return null;
    return (
      getActiveLayers(s.surfaces, s.activeSurfaceId).find(
        l => l.id === s.selectedLayerId
      ) ?? null
    );
  });
}

/** History control flags. */
export function useHistoryFlags(): { canUndo: boolean; canRedo: boolean } {
  return useEditorStore(s => ({
    canUndo: s.historyIndex > 0,
    canRedo: s.historyIndex < s.history.length - 1,
  }));
}
