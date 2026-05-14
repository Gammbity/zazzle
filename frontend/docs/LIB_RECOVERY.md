# `src/lib/` Recovery Checklist

`frontend/src/lib/` is missing from the working tree and from git history. The root `.gitignore` had `lib/` (Python venv rule) which silently excluded it. The rule has now been removed; once the folder is restored it will be tracked.

This document is the complete contract that the `lib/` folder must satisfy for the project to build. Use it either as a **verification checklist** if you find a backup, or as a **reconstruction blueprint** if you must rewrite it.

---

## Files (14 modules)

```
frontend/src/lib/
├── router.ts                       # Custom SPA router
├── utils.ts                        # cn() helper
├── queryClient.ts                  # React Query setup + queryKeys
├── commerce/                       # (or commerce.ts) Backend API client
│   └── index.ts
├── products/
│   ├── catalog.ts                  # Local product metadata
│   ├── content.ts                  # Marketing copy
│   ├── surfaces.ts                 # Product surface configs
│   └── printAreas.ts               # Print area math
├── editor/
│   ├── bounds.ts                   # Rect/clamp math
│   ├── serialize.ts                # Layer ops + zIndex helpers
│   ├── export.ts                   # PNG export
│   └── renderSurfacePreview.ts     # Compose surface preview
├── storage/
│   └── draftStorage.ts             # Local + server draft I/O
└── render/
    └── mugRenderer.ts              # Cylindrical product compositor
```

---

## Required exports per module

### `lib/router.ts`
```ts
export const Link: React.FC<{ to: string; className?: string; children: React.ReactNode; ... }>;
export const RouterProvider: React.FC<{ children: React.ReactNode }>;
export function matchPath(pattern: string, pathname: string): { params: Record<string, string> } | null;
export function navigate(to: string, opts?: { replace?: boolean }): void;
export function useLocation(): { pathname: string; search: string; hash: string };
export function useNavigate(): (to: string, opts?: { replace?: boolean }) => void;
```

### `lib/utils.ts`
```ts
export function cn(...inputs: ClassValue[]): string;   // clsx + tailwind-merge
```

### `lib/queryClient.ts`
```ts
export const queryClient: QueryClient;
export const queryKeys: {
  auth: { currentUser: readonly [string, ...]; ... };
  cart: { detail: readonly [...]; ... };
  orders: { list: (params?) => readonly [...]; detail: (id) => ...; stats: readonly [...]; };
  products: { detail: (slug) => readonly [...]; };
  // ...
};
```

### `lib/commerce` (the largest module)

**Functions:**
- `isAuthenticated(): boolean`
- `loadCurrentUser(): Promise<CommerceUser>`
- `loginCustomer(payload): Promise<CommerceUser>`
- `logoutCustomer(): Promise<void>`
- `registerCustomer(payload): Promise<CommerceUser>`
- `getCart(): Promise<CommerceCart>`
- `addCartItem(item): Promise<CommerceCart>`
- `updateCartItem(id, qty): Promise<CommerceCart>`
- `removeCartItem(id): Promise<CommerceCart>`
- `clearCart(): Promise<void>`
- `checkoutCart(payload): Promise<CheckoutResult>`
- `initPayment(orderId, provider): Promise<PaymentInitResult>`
- `getOrder(id): Promise<CommerceOrderDetail>`
- `getOrders(params?): Promise<CommerceOrderSummary[]>`
- `getOrderStats(): Promise<CommerceOrderStats>`
- `cancelOrder(id): Promise<void>`
- `fetchCommerceProductBySlug(slug): Promise<CommerceProductType>`
- `formatMoney(amount, currency?): string`
- `getCommerceErrorMessage(error: unknown): string`
- `getOrderStatusMeta(status): { label: string; color: string; ... }`
- `getRouteSlugForCategory(category): string`
- `createDraftForCart(draft): SerializedDraft`
- `createLegacyDraftForCart(legacy): SerializedDraft`

**Types:**
- `CommerceUser`, `CommerceCart`, `CommerceProductType`, `CommerceVariant`,
  `CommerceOrderDetail`, `CommerceOrderSummary`, `CommerceOrderStats`,
  `ProductColorSelection`, `CheckoutResult`, `PaymentInitResult`

### `lib/products/catalog.ts`
```ts
export type Product = { slug: string; title: string; ...; angles: ProductAngle[]; ... };
export type ProductAngle = { id: string; image: string; overlay?: OverlayBox; ... };
export type OverlayBox = { x: number; y: number; w: number; h: number };
export const catalog: Product[];
export function getProductBySlug(slug: string): Product | undefined;
```

### `lib/products/content.ts`
```ts
export const HOME_BENEFITS: { icon: ...; title: string; body: string }[];
export const HOME_STEPS: { num: number; title: string; body: string }[];
export function getProductUiContent(slug: string): { hero: string; bullets: string[]; ... };
```

### `lib/products/surfaces.ts`
```ts
export type Surface = { id: string; label: string; printArea: Rect; ... };
export function getProductSurfaces(productId: string): Surface[];
export function getProductSurface(productId: string, surfaceId: string): Surface | undefined;
export function getProductConfig(productId: string): { surfaces: Surface[]; baseImage: string; ... };
```

### `lib/products/printAreas.ts`
```ts
export function getPreviewRect(productId: string, surfaceId: string): Rect;
export function getPreviewRectFromSurface(surface: Surface): Rect;
export function fitLayerScale(layer, printArea): number;
export function getDefaultLayerPosition(printArea): { x: number; y: number };
```

### `lib/editor/bounds.ts`
```ts
export type Rect = { x: number; y: number; width: number; height: number };
export function clampPosition(pos, rect): { x: number; y: number };
export function constrainBox(box, bounds): Rect;
export function printAreaToRect(area): Rect;
```

### `lib/editor/serialize.ts`
```ts
export function uid(): string;
export function normaliseZIndexes(layers): Layer[];
export function bringForward(layers, id): Layer[];
export function sendBackward(layers, id): Layer[];
// + the SerializedDraft / Layer types referenced by editorStore
```

### `lib/editor/export.ts`
```ts
export function exportLayerAsPng(layer, opts?): Promise<Blob>;
```

### `lib/editor/renderSurfacePreview.ts`
```ts
export function renderSurfacePreview(product, surface, layers): Promise<string>; // dataURL
```

### `lib/storage/draftStorage.ts`
```ts
export function saveDraft(productId, draft): Promise<void>;            // server
export function saveDraftToLocalStorage(productId, draft): void;
export function loadDraft(productId): Promise<Draft | null>;
export function deleteDraft(productId): Promise<void>;
export function createEmptyDraft(productId): Draft;
```

### `lib/render/mugRenderer.ts`
```ts
export function composeMugPreview(opts): Promise<HTMLCanvasElement>;
export function loadImage(src: string): Promise<HTMLImageElement>;
```

---

## How this list was produced

Generated by grepping every `from '@/lib/...'` import across `frontend/src/` and recording the full named-import list per module. Re-run:

```powershell
Select-String -Path frontend/src -Pattern "from ['""]@/lib/" -Recurse
```

---

## Verification steps after restoring

```powershell
cd frontend
npm install
npm run type-check    # must pass with 0 errors
npm run build         # must succeed
```

If any imports in `src/` reference a symbol not listed above, this checklist is incomplete — append it here.
