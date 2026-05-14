/**
 * Derives editor-ready ProductConfig / ProductSurface objects from the catalog.
 *
 * Generic editor components MUST import from this module (or the store) to get
 * surface geometry. They must never import from catalog.ts directly.
 */

import { catalog } from './catalog';
import type { ProductConfig, ProductSurface } from '@/types/product';

/**
 * Convert catalog entry to editor-ready ProductConfig.
 * Returns `undefined` when the slug is not found.
 */
export function getProductConfig(productId: string): ProductConfig | undefined {
  const product = catalog.find(p => p.slug === productId);
  if (!product) return undefined;

  const surfaces: ProductSurface[] = product.angles.map(angle => ({
    id: angle.id,
    label: angle.label,
    previewSrc: angle.src,
    previewAlt: angle.alt,
    printArea: {
      x: angle.printableArea.x,
      y: angle.printableArea.y,
      width: angle.printableArea.width,
      height: angle.printableArea.height,
      defaultScale: angle.printableArea.defaultScale,
      defaultRotation: angle.printableArea.defaultRotation,
    },
    // previewBox is photo-space (% of the base product photo).
    // overlayBox in the catalog is specifically calibrated to position
    // the design correctly on each product image angle.
    previewBox: angle.overlayBox
      ? {
          x: angle.overlayBox.x,
          y: angle.overlayBox.y,
          width: angle.overlayBox.width,
          height: angle.overlayBox.height,
        }
      : undefined,
    canvasAspect: product.canvasAspect,
  }));

  return {
    id: product.slug,
    name: product.name,
    surfaces,
    defaultSurfaceId: surfaces[0]?.id ?? 'front',
  };
}

/**
 * Return surfaces for a product, or [] when not found.
 */
export function getProductSurfaces(productId: string): ProductSurface[] {
  return getProductConfig(productId)?.surfaces ?? [];
}

/**
 * Return a single surface by productId + surfaceId, or undefined.
 */
export function getProductSurface(
  productId: string,
  surfaceId: string
): ProductSurface | undefined {
  return getProductSurfaces(productId).find(s => s.id === surfaceId);
}

/** All available product IDs. */
export function getAllProductIds(): string[] {
  return catalog.map(p => p.slug);
}
