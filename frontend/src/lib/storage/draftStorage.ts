/**
 * Draft persistence using IndexedDB.
 *
 * Uses the versioned EditorDraft schema.  Resilient to:
 *   - corrupt / unparseable stored data
 *   - schema mismatch (version field check)
 *   - missing or malformed layers arrays
 *   - browser environments that don't support IndexedDB
 *
 * The editor UI should import ONLY the public API from this module.
 * No component or store should touch IndexedDB directly.
 */

import type { EditorDraft, SurfaceState } from '@/types/editor';
import type { Layer } from '@/types/layer';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DB_NAME = 'ZazzleDraftsDB';
const STORE_NAME = 'drafts';
const DB_VERSION = 2; // bump when schema changes
const DRAFT_KEY_PREFIX = 'draft_v1_';
const LOCAL_DRAFT_KEY_PREFIX = 'draft_local_v1_';
const CURRENT_DRAFT_VERSION = 1 as const;

// ---------------------------------------------------------------------------
// IndexedDB connection (singleton promise)
// ---------------------------------------------------------------------------

let _dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      _dbPromise = null; // allow retry on next call
      reject(request.error);
    };

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return _dbPromise;
}

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

function isValidLayer(value: unknown): value is Layer {
  if (!value || typeof value !== 'object') return false;
  const l = value as Record<string, unknown>;
  return (
    typeof l.id === 'string' &&
    ['image', 'text', 'sticker'].includes(l.type as string) &&
    typeof l.x === 'number' &&
    typeof l.y === 'number'
  );
}

function isValidSurface(value: unknown): value is SurfaceState {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    Array.isArray(s.layers) &&
    (s.layers as unknown[]).every(isValidLayer)
  );
}

/**
 * Validate that a parsed object conforms to EditorDraft version 1.
 * Returns `null` on any mismatch to allow graceful fallback.
 */
function validateDraft(raw: unknown): EditorDraft | null {
  try {
    if (!raw || typeof raw !== 'object') return null;
    const d = raw as Record<string, unknown>;

    if (d.version !== CURRENT_DRAFT_VERSION) return null;
    if (typeof d.productId !== 'string') return null;
    if (typeof d.activeSurfaceId !== 'string') return null;
    if (!Array.isArray(d.surfaces)) return null;
    if (!(d.surfaces as unknown[]).every(isValidSurface)) return null;

    return d as unknown as EditorDraft;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function draftKey(productId: string): string {
  return `${DRAFT_KEY_PREFIX}${productId}`;
}

function localDraftKey(productId: string): string {
  return `${LOCAL_DRAFT_KEY_PREFIX}${productId}`;
}

function getDraftTimestamp(draft: EditorDraft | null): number {
  if (!draft) {
    return 0;
  }

  const timestamp = Date.parse(draft.updatedAt);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function saveDraftToLocalStorage(draft: EditorDraft): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      localDraftKey(draft.productId),
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })
    );
  } catch (err) {
    console.warn('[draftStorage] local save failed:', err);
  }
}

function loadDraftFromLocalStorage(productId: string): EditorDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(localDraftKey(productId));
    if (!raw) {
      return null;
    }

    return validateDraft(JSON.parse(raw));
  } catch (err) {
    console.warn('[draftStorage] local load failed:', err);
    return null;
  }
}

/**
 * Persist the draft to IndexedDB.
 * Silently swallows errors (offline / private browsing / quota exceeded).
 */
export async function saveDraft(draft: EditorDraft): Promise<void> {
  saveDraftToLocalStorage(draft);

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_NAME).put(
        { ...draft, updatedAt: new Date().toISOString() },
        draftKey(draft.productId)
      );
    });
  } catch (err) {
    console.warn('[draftStorage] saveDraft failed:', err);
  }
}

/**
 * Load and validate the draft for a product.
 * Returns `null` when not found, corrupt, or schema-mismatched.
 */
export async function loadDraft(
  productId: string
): Promise<EditorDraft | null> {
  const localDraft = loadDraftFromLocalStorage(productId);

  try {
    const db = await getDB();
    const raw = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(draftKey(productId));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const indexedDbDraft = validateDraft(raw);

    return getDraftTimestamp(localDraft) > getDraftTimestamp(indexedDbDraft)
      ? localDraft
      : indexedDbDraft;
  } catch (err) {
    console.warn('[draftStorage] loadDraft failed:', err);
    return localDraft;
  }
}

/**
 * Delete a product's draft from IndexedDB. Silently ignores errors.
 */
export async function deleteDraft(productId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(localDraftKey(productId));
    } catch (err) {
      console.warn('[draftStorage] local delete failed:', err);
    }
  }

  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(draftKey(productId));
  } catch (err) {
    console.warn('[draftStorage] deleteDraft failed:', err);
  }
}

/**
 * Build a fresh EditorDraft for a product with empty surfaces.
 */
export function createEmptyDraft(
  productId: string,
  surfaceIds: string[]
): EditorDraft {
  return {
    version: CURRENT_DRAFT_VERSION,
    productId,
    activeSurfaceId: surfaceIds[0] ?? 'front',
    surfaces: surfaceIds.map(id => ({ id, layers: [] })),
    updatedAt: new Date().toISOString(),
  };
}
