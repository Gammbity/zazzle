import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { DeliveryMethod, OrderDetail, OrderStatus, OrderSummary, PaginatedResponse } from '~/types/commerce';

export interface AdminOrderFilters {
  status?: string;
  delivery_method?: DeliveryMethod;
  search?: string;
  page?: number;
  [key: string]: unknown;
}

export interface UpdateAdminOrderPayload {
  status?: OrderStatus;
  admin_notes?: string;
  tracking_number?: string;
  carrier?: string;
}

export interface AdminOperator {
  id: number;
  email: string;
  full_name: string;
}

export function useAdminOrders(filters: Ref<AdminOrderFilters> | AdminOrderFilters = {}) {
  const api = useApi();
  const isProductionStaff = useIsProductionStaff();
  const filtersRef = isRef(filters) ? filters : ref(filters);

  return useQuery<PaginatedResponse<OrderSummary>>({
    queryKey: computed(() => ['admin', 'orders', filtersRef.value] as const),
    queryFn: () => api.get<PaginatedResponse<OrderSummary>>('/orders/admin/orders/', filtersRef.value),
    enabled: isProductionStaff,
  });
}

export function useAdminOrder(id: number | undefined) {
  const api = useApi();
  const isProductionStaff = useIsProductionStaff();

  return useQuery<OrderDetail | null>({
    queryKey: ['admin', 'orders', 'detail', id] as const,
    queryFn: () => (id ? api.get<OrderDetail>(`/orders/admin/orders/${id}/`) : Promise.resolve(null)),
    enabled: computed(() => Boolean(id) && isProductionStaff.value),
  });
}

export function useUpdateAdminOrder() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: number; payload: UpdateAdminOrderPayload }) =>
      api.patch<OrderDetail>(`/orders/admin/orders/${input.id}/`, input.payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useUpdateOrderProductionStatus() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { orderId: number; status: string }) =>
      api.post(`/orders/${input.orderId}/status`, { status: input.status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', 'detail', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useAssignOrder() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { orderId: number; managerId: number }) =>
      api.post(`/orders/${input.orderId}/assign`, { manager_id: input.managerId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', 'detail', variables.orderId] });
    },
  });
}

export function useCenterEmployees(centerId: Ref<number | undefined> | number | undefined) {
  const api = useApi();
  const isProductionStaff = useIsProductionStaff();
  const centerIdRef = isRef(centerId) ? centerId : ref(centerId);

  return useQuery<AdminOperator[]>({
    queryKey: computed(() => ['admin', 'centerEmployees', centerIdRef.value] as const),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<AdminOperator> | AdminOperator[]>(`/admin/production-centers/${centerIdRef.value}/employees/`);
      return Array.isArray(response) ? response : response.results;
    },
    enabled: computed(() => Boolean(centerIdRef.value) && isProductionStaff.value),
    retry: false,
    throwOnError: false,
  });
}
