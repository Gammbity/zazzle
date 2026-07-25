import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { queryKeys } from '~/lib/queryKeys';
import type { CheckoutInput, CheckoutResult, PaymentInitResult } from '~/types/commerce';

export function useCheckout() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckoutInput) => api.post<CheckoutResult>('/checkout/', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useInitPayment() {
  const api = useApi();

  return useMutation({
    mutationFn: (input: { orderId: number; provider: 'payme' | 'click' | 'uzcard_humo'; idempotencyKey: string }) =>
      api.post<PaymentInitResult>('/payments/init/', {
        order_id: input.orderId,
        provider: input.provider,
        idempotency_key: input.idempotencyKey,
      }),
  });
}
