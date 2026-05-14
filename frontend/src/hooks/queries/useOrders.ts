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
    }) => {
      const id = Number(input.orderId);
      if (Number.isNaN(id)) {
        return Promise.reject(new Error('Invalid orderId'));
      }
      return initPayment(id, input.provider, input.idempotencyKey);
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string | number) => {
      const id = Number(orderId);
      if (Number.isNaN(id)) {
        return Promise.reject(new Error('Invalid orderId'));
      }
      return cancelOrder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}
