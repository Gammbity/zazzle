import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminUser,
  getAdminUsers,
  updateUserRole,
  type AdminUserFilters,
  type CreateAdminUserPayload,
  type UpdateUserRolePayload,
} from '@/lib/adminApi';
import { queryKeys } from '@/lib/queryClient';
import { useIsSuperAdmin } from '@/hooks/queries/useAuth';

export function useAdminUsers(filters: AdminUserFilters = {}) {
  const isSuperAdmin = useIsSuperAdmin();
  return useQuery({
    queryKey: queryKeys.adminUsers(filters),
    queryFn: () => getAdminUsers(filters),
    enabled: isSuperAdmin,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: UpdateUserRolePayload;
    }) => updateUserRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdminUserPayload) => createAdminUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
