import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignOrder,
  getAdminOrder,
  getAdminOrders,
  getOperators,
  updateAdminOrder,
  updateOrderProductionStatus,
  type AdminOrderFilters,
  type UpdateAdminOrderPayload,
} from '@/lib/adminApi';
import { queryKeys } from '@/lib/queryClient';
import { useCanManageOrders } from '@/hooks/queries/useAuth';

export function useAdminOrders(filters: AdminOrderFilters = {}) {
  const canManageOrders = useCanManageOrders();
  return useQuery({
    queryKey: queryKeys.adminOrders(filters),
    queryFn: () => getAdminOrders(filters),
    enabled: canManageOrders,
  });
}

export function useAdminOrder(id: number | string | undefined) {
  const canManageOrders = useCanManageOrders();
  return useQuery({
    queryKey: queryKeys.adminOrder(id ?? 'none'),
    queryFn: () => getAdminOrder(id as number | string),
    enabled: Boolean(id) && canManageOrders,
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
      operatorId,
    }: {
      orderId: number | string;
      operatorId: number;
    }) => assignOrder(orderId, operatorId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminOrder(variables.orderId),
      });
    },
  });
}

export function useOperators() {
  const canManageOrders = useCanManageOrders();
  return useQuery({
    queryKey: queryKeys.adminOperators,
    queryFn: getOperators,
    enabled: canManageOrders,
    // The backing endpoint requires role=admin (a narrower check than is_staff);
    // a staff-only admin will 403 here — treat that as "no operators to show".
    retry: false,
    throwOnError: false,
  });
}
