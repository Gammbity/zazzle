// The public, memorable URL slugs (`/products/t-shirt`, footer/category
// links) don't match the backend's own product slugs 1:1 — map here so
// every price/order lookup resolves to the real catalog entry.
const BACKEND_SLUG_MAP: Record<string, string> = {
  't-shirt': 'classic-t-shirt',
  'mug': 'classic-white-mug',
  'business-card': 'premium-business-cards',
  'desk-calendar': 'custom-desk-calendar',
  'pen': 'promo-pen',
};

export function toBackendSlug(urlSlug: string): string {
  return BACKEND_SLUG_MAP[urlSlug] ?? urlSlug;
}

// Reverse direction — backend `product_category` values (e.g. cart items,
// order lines) back to the public route slug, for "open product page" links.
const CATEGORY_TO_ROUTE_SLUG: Record<string, string> = {
  tshirt: 't-shirt',
  mug: 'mug',
  business_card: 'business-card',
  desk_calendar: 'desk-calendar',
  pen: 'pen',
};

export function getRouteSlugForCategory(category: string): string | null {
  return CATEGORY_TO_ROUTE_SLUG[category] ?? null;
}
