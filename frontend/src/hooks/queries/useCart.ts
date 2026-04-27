import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addCartItem,
  clearCart,
  getCart,
  isAuthenticated,
  removeCartItem,
  updateCartItem,
  type CommerceCart,
} from '@/lib/commerce';
import { queryKeys } from '@/lib/queryClient';

export function useCart(options?: { enabled?: boolean }) {
  return useQuery<CommerceCart>({
    queryKey: queryKeys.cart,
    queryFn: getCart,
    enabled: (options?.enabled ?? true) && isAuthenticated(),
    staleTime: 15_000,
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { draftUuid: string; quantity: number }) =>
      addCartItem(input.draftUuid, input.quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemUuid: string; quantity: number }) =>
      updateCartItem(input.itemUuid, input.quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemUuid: string) => removeCartItem(itemUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}
