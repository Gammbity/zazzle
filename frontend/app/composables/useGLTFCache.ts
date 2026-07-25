import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Module-level cache so re-opening the Preview modal (or switching between
// products) doesn't re-download a multi-MB .glb every time.
const cache = new Map<string, Promise<GLTF>>();
const loader = new GLTFLoader();

export function loadGLTFCached(url: string): Promise<GLTF> {
  let pending = cache.get(url);
  if (!pending) {
    pending = loader.loadAsync(url);
    cache.set(url, pending);
  }
  return pending;
}
