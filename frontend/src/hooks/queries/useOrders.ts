import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelOrder,
  checkoutCart,
  getOrder,
  getOrders,
  getOrderStats,
  initPayment,
  isAuthenticated,
  type CommerceOrderDetail,
  type CommerceOrderStats,
  type CommerceOrderSummary,
} from '@/lib/commerce';
import { queryKeys } from '@/lib/queryClient';

export function useOrders() {
  return useQuery<CommerceOrderSummary[]>({
    queryKey: queryKeys.orderList,
    queryFn: getOrders,
    enabled: isAuthenticated(),
  });
}

export function useOrderStats() {
  return useQuery<CommerceOrderStats>({
    queryKey: queryKeys.orderStats,
    queryFn: getOrderStats,
    enabled: isAuthenticated(),
  });
}

export function useOrder(lookup: string | undefined) {
  return useQuery<CommerceOrderDetail | null>({
    queryKey: lookup ? queryKeys.order(lookup) : ['orders', 'detail', 'none'],
    queryFn: () => (lookup ? getOrder(lookup) : Promise.resolve(null)),
    enabled: Boolean(lookup) && isAuthenticated(),
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkoutCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useInitPayment() {
  return useMutation({
    mutationFn: (input: {
      orderId: string | number;
      provider: 'payme' | 'click' | 'uzcard_humo';
      idempotencyKey: string;
    }) => initPayment(input.orderId, input.provider, input.idempotencyKey),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string | number) => cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}
