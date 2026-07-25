import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { queryKeys } from '~/lib/queryKeys';
import type { AuthPayload, CurrentUser, RegisterPayload } from '~/types/commerce';

export function useCurrentUser() {
  const api = useApi();
  const authState = useAuthState();

  return useQuery<CurrentUser | null>({
    queryKey: queryKeys.currentUser,
    queryFn: () => api.get<CurrentUser>('/users/profile/me/'),
    enabled: authState,
    staleTime: 5 * 60_000,
  });
}

// "Can enter the admin panel shell at all" — staff, super admins, and any
// production-center-scoped staff (page/nav-level checks below narrow what
// they actually see once inside).
export function useIsAdmin() {
  const { data } = useCurrentUser();
  return computed(() => Boolean(
    data.value?.is_staff
    || data.value?.is_super_admin
    || data.value?.is_production_admin
    || data.value?.is_production_manager,
  ));
}

// Platform-wide access only — manages products, production centers, users/roles.
export function useIsSuperAdmin() {
  const { data } = useCurrentUser();
  return computed(() => Boolean(data.value?.is_super_admin));
}

// Super admin, or a production admin (their own center's employees/orders).
export function useIsProductionAdmin() {
  const { data } = useCurrentUser();
  return computed(() => Boolean(data.value?.is_super_admin || data.value?.is_production_admin));
}

// Super admin, or any production-center-scoped staff — gates the Orders nav
// section; actual row-level scoping happens server-side.
export function useIsProductionStaff() {
  const { data } = useCurrentUser();
  return computed(() => Boolean(
    data.value?.is_super_admin
    || data.value?.is_production_admin
    || data.value?.is_production_manager,
  ));
}

export function useLogin() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AuthPayload) => {
      const response = await api.post<{ user: CurrentUser }>('/auth/login/', payload);
      return response.user;
    },
    onSuccess: (user) => {
      syncAuthState(true);
      queryClient.setQueryData(queryKeys.currentUser, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useRegister() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const firstName = payload.first_name.trim();
      const lastName = payload.last_name.trim();
      const displayName = payload.display_name?.trim() || [firstName, lastName].filter(Boolean).join(' ');
      const usernameBase = (payload.username?.trim() || payload.email.split('@')[0] || `${firstName}.${lastName}`)
        .toLowerCase()
        .replace(/[^a-z0-9@.+_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120);
      const usernameSuffix = Math.random().toString(36).slice(2, 8);

      const response = await api.post<{ user: CurrentUser }>('/auth/register/', {
        ...payload,
        username: `${usernameBase || 'user'}-${usernameSuffix}`,
        display_name: displayName,
        password_confirm: payload.password,
      });
      return response.user;
    },
    onSuccess: (user) => {
      syncAuthState(true);
      queryClient.setQueryData(queryKeys.currentUser, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

function useOAuthLoginMutation<TInput>(path: string, toBody: (input: TInput) => Record<string, unknown>) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TInput) => {
      const response = await api.post<{ user: CurrentUser }>(path, toBody(input));
      return response.user;
    },
    onSuccess: (user) => {
      syncAuthState(true);
      queryClient.setQueryData(queryKeys.currentUser, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useGoogleLogin() {
  return useOAuthLoginMutation<string>('/auth/oauth/google/', idToken => ({ id_token: idToken }));
}

export function useFacebookLogin() {
  return useOAuthLoginMutation<string>('/auth/oauth/facebook/', accessToken => ({ access_token: accessToken }));
}

export function useTelegramLogin() {
  return useOAuthLoginMutation<Record<string, unknown>>('/auth/oauth/telegram/', payload => payload);
}

export function useLogout() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/auth/logout/'),
    onSettled: () => {
      syncAuthState(false);
      queryClient.setQueryData(queryKeys.currentUser, null);
      queryClient.removeQueries({ queryKey: queryKeys.cart });
      queryClient.removeQueries({ queryKey: queryKeys.orders });
    },
  });
}
