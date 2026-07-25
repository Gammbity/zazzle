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

// "Can enter the admin panel shell at all" — staff, super admins, and any
// production-center-scoped staff (page/nav-level checks below narrow what
// they actually see once inside).
export function useIsAdmin(): boolean {
  const { data } = useCurrentUser();
  return Boolean(
    data?.is_staff ||
    data?.is_super_admin ||
    data?.is_production_admin ||
    data?.is_production_manager
  );
}

// Platform-wide access only — manages production centers, users/roles.
export function useIsSuperAdmin(): boolean {
  const { data } = useCurrentUser();
  return Boolean(data?.is_super_admin);
}

// Super admin, or a production admin (their own center's employees/orders).
export function useIsProductionAdmin(): boolean {
  const { data } = useCurrentUser();
  return Boolean(data?.is_super_admin || data?.is_production_admin);
}

// Super admin, or any production-center-scoped staff — gates the Orders nav
// section; actual row-level scoping happens server-side.
export function useIsProductionStaff(): boolean {
  const { data } = useCurrentUser();
  return Boolean(
    data?.is_super_admin ||
    data?.is_production_admin ||
    data?.is_production_manager
  );
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
