import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignOrder,
  getAdminOrder,
  getAdminOrders,
  getCenterEmployees,
  updateAdminOrder,
  updateOrderProductionStatus,
  type AdminOrderFilters,
  type UpdateAdminOrderPayload,
} from '@/lib/adminApi';
import { queryKeys } from '@/lib/queryClient';
import { useIsProductionStaff } from '@/hooks/queries/useAuth';

export function useAdminOrders(filters: AdminOrderFilters = {}) {
  const isProductionStaff = useIsProductionStaff();
  return useQuery({
    queryKey: queryKeys.adminOrders(filters),
    queryFn: () => getAdminOrders(filters),
    enabled: isProductionStaff,
  });
}

export function useAdminOrder(id: number | string | undefined) {
  const isProductionStaff = useIsProductionStaff();
  return useQuery({
    queryKey: queryKeys.adminOrder(id ?? 'none'),
    queryFn: () => getAdminOrder(id as number | string),
    enabled: Boolean(id) && isProductionStaff,
  });
}

export function useUpdateAdminOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: UpdateAdminOrderPayload;
    }) => updateAdminOrder(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminOrder(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useUpdateOrderProductionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: number | string;
      status: string;
    }) => updateOrderProductionStatus(orderId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminOrder(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useAssignOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      managerId,
    }: {
      orderId: number | string;
      managerId: number;
    }) => assignOrder(orderId, managerId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminOrder(variables.orderId),
      });
    },
  });
}

// Production managers of one specific center — used to populate the
// assign-order picker, scoped to the order's own production_center.
export function useCenterEmployees(centerId: number | string | undefined) {
  const isProductionStaff = useIsProductionStaff();
  return useQuery({
    queryKey: queryKeys.centerEmployees(centerId ?? 'none'),
    queryFn: () => getCenterEmployees(centerId as number | string),
    enabled: Boolean(centerId) && isProductionStaff,
    retry: false,
    throwOnError: false,
  });
}
