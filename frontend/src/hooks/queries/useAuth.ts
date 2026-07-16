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

// "Can enter the admin panel shell at all" — true staff/admins, plus any
// manager (page/section-level checks below narrow what they actually see).
export function useIsAdmin(): boolean {
  const { data } = useCurrentUser();
  return Boolean(data?.is_staff) || data?.role === 'manager';
}

// True admin/superuser only — grants roles/permissions, sees the Users page.
export function useIsTrueAdmin(): boolean {
  const { data } = useCurrentUser();
  return Boolean(data?.is_admin_user);
}

export function useCanManageOrders(): boolean {
  const { data } = useCurrentUser();
  return Boolean(data?.is_admin_user || data?.can_manage_orders);
}

export function useCanManageProducts(): boolean {
  const { data } = useCurrentUser();
  return Boolean(data?.is_admin_user || data?.can_manage_products);
}

export function useCanManagePickupLocations(): boolean {
  const { data } = useCurrentUser();
  return Boolean(data?.is_admin_user || data?.can_manage_pickup_locations);
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
