import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();

export const queryKeys = {
  currentUser: ['currentUser'] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  orderList: ['orders', 'list'] as const,
  orderStats: ['orders', 'stats'] as const,
  order: (lookup: string | number) =>
    ['orders', 'detail', String(lookup)] as const,
  commerceProduct: (slug: string) => ['commerceProduct', slug] as const,
  adminOrders: (filters: object = {}) =>
    ['admin', 'orders', 'list', filters] as const,
  adminOrder: (id: string | number) =>
    ['admin', 'orders', 'detail', String(id)] as const,
  adminOperators: ['admin', 'operators'] as const,
  adminProducts: (filters: object = {}) =>
    ['admin', 'products', 'list', filters] as const,
  adminProduct: (id: string | number) =>
    ['admin', 'products', 'detail', String(id)] as const,
  pickupLocations: ['pickupLocations'] as const,
  adminPickupLocations: ['admin', 'pickupLocations'] as const,
  adminPickupLocation: (id: string | number) =>
    ['admin', 'pickupLocations', 'detail', String(id)] as const,
  adminUsers: (filters: object = {}) =>
    ['admin', 'users', 'list', filters] as const,
} as const;
