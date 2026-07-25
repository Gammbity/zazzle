// Mirrors the old frontend's `lib/queryClient.ts` queryKeys map — same
// cache-key shape, so invalidation logic reads the same way. Extend as
// more query composables get added.
export const queryKeys = {
  currentUser: ['currentUser'] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  orderList: ['orders', 'list'] as const,
  order: (lookup: string | number) => ['orders', 'detail', String(lookup)] as const,
  commerceProduct: (slug: string) => ['commerceProduct', slug] as const,
  productionCenters: (filters: Record<string, unknown>) => ['productionCenters', filters] as const,
};
