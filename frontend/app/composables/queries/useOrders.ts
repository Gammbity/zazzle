import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { queryKeys } from '~/lib/queryKeys';
import type { OrderAnalytics, OrderDetail, OrderStats, OrderSummary, PaginatedResponse } from '~/types/commerce';

export function useOrders() {
  const api = useApi();
  const authState = useAuthState();

  return useQuery<OrderSummary[]>({
    queryKey: queryKeys.orderList,
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<OrderSummary>>('/orders/');
      return response.results;
    },
    enabled: authState,
  });
}

export function useOrderStats() {
  const api = useApi();
  const authState = useAuthState();

  return useQuery<OrderStats>({
    queryKey: ['orders', 'stats'] as const,
    queryFn: () => api.get<OrderStats>('/orders/stats/'),
    enabled: authState,
  });
}

export function useOrderAnalytics(days: Ref<number> | number = 30) {
  const api = useApi();
  const authState = useAuthState();
  const daysRef = isRef(days) ? days : ref(days);

  return useQuery<OrderAnalytics>({
    queryKey: computed(() => ['orders', 'analytics', daysRef.value] as const),
    queryFn: () => api.get<OrderAnalytics>('/orders/analytics/', { days: daysRef.value }),
    enabled: authState,
  });
}

export function useOrder(lookup: string | undefined) {
  const api = useApi();
  const authState = useAuthState();

  return useQuery<OrderDetail | null>({
    queryKey: lookup ? queryKeys.order(lookup) : ['orders', 'detail', 'none'],
    queryFn: () => (lookup ? api.get<OrderDetail>(`/orders/${lookup}/`) : Promise.resolve(null)),
    enabled: computed(() => Boolean(lookup) && authState.value),
  });
}

export function useCancelOrder() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => api.post(`/orders/${orderId}/cancel/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}
