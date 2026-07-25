import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { queryKeys } from '~/lib/queryKeys';
import type { Cart } from '~/types/commerce';

export function useCart() {
  const api = useApi();
  const authState = useAuthState();

  return useQuery<Cart>({
    queryKey: queryKeys.cart,
    queryFn: () => api.get<Cart>('/cart/'),
    enabled: authState,
    staleTime: 15_000,
  });
}

export function useAddCartItem() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { draftUuid: string; quantity: number }) =>
      api.post('/cart/items/', { draft_uuid: input.draftUuid, quantity: input.quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useUpdateCartItem() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { itemUuid: string; quantity: number }) =>
      api.patch(`/cart/items/${input.itemUuid}/`, { quantity: input.quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useRemoveCartItem() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemUuid: string) => api.delete(`/cart/items/${itemUuid}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useClearCart() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.delete('/cart/clear/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}
