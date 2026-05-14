/**
 * serialize.ts – layer helpers and backward-compat re-exports.
 *
 * Draft persistence has been moved to `@/lib/storage/draftStorage`.
 * Import saveDraft / loadDraft / deleteDraft from there.
 *
 * This file keeps the layer ordering helpers so existing callers don't break.
 */

export {
  saveDraft,
  loadDraft,
  deleteDraft,
  createEmptyDraft,
} from '@/lib/storage/draftStorage';
export type { EditorDraft } from '@/types/editor';
export type { Layer } from '@/types/layer';

// ---------------------------------------------------------------------------
// Unique ID generator
// ---------------------------------------------------------------------------

export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Layer z-index helpers
// ---------------------------------------------------------------------------

import type { Layer } from '@/types/layer';

/** Re-index zIndex values so they are contiguous 0…n-1. Stable on equal zIndex. */
export function normaliseZIndexes(layers: Layer[]): Layer[] {
  return [...layers]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((l, i) => ({ ...l, zIndex: i }));
}

/** Move a layer one step forward (increase zIndex). Returns a new array. */
export function bringForward(layers: Layer[], layerId: string): Layer[] {
  const sorted = normaliseZIndexes(layers);
  const ci = sorted.findIndex(l => l.id === layerId);
  if (ci === -1 || ci === sorted.length - 1) return layers;
  const next = sorted[ci + 1];
  return sorted.map(l => {
    if (l.id === layerId) return { ...l, zIndex: next.zIndex };
    if (l.id === next.id) return { ...l, zIndex: ci };
    return l;
  });
}

/** Move a layer one step backward (decrease zIndex). Returns a new array. */
export function sendBackward(layers: Layer[], layerId: string): Layer[] {
  const sorted = normaliseZIndexes(layers);
  const ci = sorted.findIndex(l => l.id === layerId);
  if (ci <= 0) return layers;
  const prev = sorted[ci - 1];
  return sorted.map(l => {
    if (l.id === layerId) return { ...l, zIndex: prev.zIndex };
    if (l.id === prev.id) return { ...l, zIndex: ci };
    return l;
  });
}
