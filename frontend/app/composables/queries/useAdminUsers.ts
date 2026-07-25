import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { CurrentUser, PaginatedResponse, UserRole } from '~/types/commerce';

export interface AdminUserFilters {
  role?: UserRole;
  search?: string;
  page?: number;
  [key: string]: unknown;
}

export type UpdateUserRolePayload = Partial<{
  role: UserRole;
  production_center: number | null;
}>;

export interface CreateAdminUserPayload {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  production_center?: number | null;
}

export function useAdminUsers(filters: AdminUserFilters = {}) {
  const api = useApi();
  const isSuperAdmin = useIsSuperAdmin();

  return useQuery<PaginatedResponse<CurrentUser> | CurrentUser[]>({
    queryKey: ['admin', 'users', filters] as const,
    queryFn: () => api.get<PaginatedResponse<CurrentUser> | CurrentUser[]>('/users/admin/list/', filters),
    enabled: isSuperAdmin,
  });
}

export function useUpdateUserRole() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: number; payload: UpdateUserRolePayload }) =>
      api.patch<CurrentUser>(`/users/admin/${input.id}/role/`, input.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useCreateAdminUser() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminUserPayload) => api.post<CurrentUser>('/users/admin/create/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
