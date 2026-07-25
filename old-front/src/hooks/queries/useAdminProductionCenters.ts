import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminProductionCenter,
  createCenterEmployee,
  deleteAdminProductionCenter,
  getAdminProductionCenters,
  updateAdminProductionCenter,
  updateCenterEmployee,
  type CreateCenterEmployeePayload,
  type ProductionCenterPayload,
} from '@/lib/adminApi';
import { queryKeys } from '@/lib/queryClient';
import { useIsSuperAdmin } from '@/hooks/queries/useAuth';

export function useAdminProductionCenters() {
  const isSuperAdmin = useIsSuperAdmin();
  return useQuery({
    queryKey: queryKeys.adminProductionCenters,
    queryFn: getAdminProductionCenters,
    enabled: isSuperAdmin,
  });
}

export function useCreateAdminProductionCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductionCenterPayload) =>
      createAdminProductionCenter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminProductionCenters,
      });
    },
  });
}

export function useUpdateAdminProductionCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: ProductionCenterPayload;
    }) => updateAdminProductionCenter(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminProductionCenters,
      });
    },
  });
}

export function useDeleteAdminProductionCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteAdminProductionCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminProductionCenters,
      });
    },
  });
}

export function useCreateCenterEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: number | string;
      payload: CreateCenterEmployeePayload;
    }) => createCenterEmployee(centerId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.centerEmployees(variables.centerId),
      });
    },
  });
}

export function useUpdateCenterEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      centerId,
      employeeId,
      payload,
    }: {
      centerId: number | string;
      employeeId: number | string;
      payload: { is_active: boolean };
    }) => updateCenterEmployee(centerId, employeeId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.centerEmployees(variables.centerId),
      });
    },
  });
}
