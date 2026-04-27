import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  isAuthenticated,
  loadCurrentUser,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  type CommerceUser,
} from '@/lib/commerce';
import { queryKeys } from '@/lib/queryClient';

export function useCurrentUser() {
  return useQuery<CommerceUser | null>({
    queryKey: queryKeys.currentUser,
    queryFn: loadCurrentUser,
    enabled: isAuthenticated(),
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginCustomer,
    onSuccess: user => {
      queryClient.setQueryData(queryKeys.currentUser, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerCustomer,
    onSuccess: user => {
      queryClient.setQueryData(queryKeys.currentUser, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutCustomer,
    onSettled: () => {
      queryClient.setQueryData(queryKeys.currentUser, null);
      queryClient.removeQueries({ queryKey: queryKeys.cart });
      queryClient.removeQueries({ queryKey: queryKeys.orders });
    },
  });
}
