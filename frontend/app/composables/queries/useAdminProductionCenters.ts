import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { PaginatedResponse, ProductionCenter, ProductionCenterType } from '~/types/commerce';

export type ProductionCenterPayload = Partial<{
  name: string;
  type: ProductionCenterType;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string;
  is_active: boolean;
  supports_pickup: boolean;
  supports_delivery: boolean;
  sort_order: number;
}>;

const ADMIN_CENTERS_KEY = ['admin', 'productionCenters'] as const;

export function useAdminProductionCenters() {
  const api = useApi();
  const isSuperAdmin = useIsSuperAdmin();

  return useQuery<PaginatedResponse<ProductionCenter> | ProductionCenter[]>({
    queryKey: ADMIN_CENTERS_KEY,
    queryFn: () => api.get<PaginatedResponse<ProductionCenter> | ProductionCenter[]>('/admin/production-centers/'),
    enabled: isSuperAdmin,
  });
}

export function useCreateAdminProductionCenter() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductionCenterPayload) => api.post<ProductionCenter>('/admin/production-centers/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CENTERS_KEY });
    },
  });
}

export function useUpdateAdminProductionCenter() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: number; payload: ProductionCenterPayload }) =>
      api.patch<ProductionCenter>(`/admin/production-centers/${input.id}/`, input.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CENTERS_KEY });
    },
  });
}

export function useDeleteAdminProductionCenter() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/production-centers/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CENTERS_KEY });
    },
  });
}
