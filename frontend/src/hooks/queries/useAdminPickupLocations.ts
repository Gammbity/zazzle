import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminPickupLocation,
  deleteAdminPickupLocation,
  getAdminPickupLocations,
  updateAdminPickupLocation,
  type PickupLocationPayload,
} from '@/lib/adminApi';
import { queryKeys } from '@/lib/queryClient';
import { useCanManagePickupLocations } from '@/hooks/queries/useAuth';

export function useAdminPickupLocations() {
  const canManage = useCanManagePickupLocations();
  return useQuery({
    queryKey: queryKeys.adminPickupLocations,
    queryFn: getAdminPickupLocations,
    enabled: canManage,
  });
}

export function useCreateAdminPickupLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PickupLocationPayload) =>
      createAdminPickupLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminPickupLocations,
      });
    },
  });
}

export function useUpdateAdminPickupLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: PickupLocationPayload;
    }) => updateAdminPickupLocation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminPickupLocations,
      });
    },
  });
}

export function useDeleteAdminPickupLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteAdminPickupLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminPickupLocations,
      });
    },
  });
}
