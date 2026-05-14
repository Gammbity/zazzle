import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();

export const queryKeys = {
  currentUser: ['currentUser'] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  orderList: ['orders', 'list'] as const,
  orderStats: ['orders', 'stats'] as const,
  order: (lookup: string | number) => ['orders', 'detail', String(lookup)] as const,
  commerceProduct: (slug: string) => ['commerceProduct', slug] as const,
} as const;
