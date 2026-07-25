import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { CommerceProductType, CommerceVariant, PaginatedResponse } from '~/types/commerce';

export interface AdminProductFilters {
  category?: string;
  is_active?: boolean;
  search?: string;
  [key: string]: unknown;
}

export type UpdateAdminProductPayload = Partial<{
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  has_size_variants: boolean;
  has_color_variants: boolean;
  available_sizes: string[];
  available_colors: Array<{ name: string; hex?: string }>;
}>;

export interface AdminVariantPayload {
  size?: string;
  color?: string;
  color_hex?: string;
  sale_price?: string;
  production_cost?: string;
  is_active?: boolean;
  is_default?: boolean;
  stock_quantity?: number;
}

export function useAdminProducts(filters: AdminProductFilters = {}) {
  const api = useApi();
  const isSuperAdmin = useIsSuperAdmin();

  return useQuery<PaginatedResponse<CommerceProductType> | CommerceProductType[]>({
    queryKey: ['admin', 'products', filters] as const,
    queryFn: () => api.get<PaginatedResponse<CommerceProductType> | CommerceProductType[]>('/products/admin/list/', filters),
    enabled: isSuperAdmin,
  });
}

export function useAdminProduct(id: number | undefined) {
  const api = useApi();
  const isSuperAdmin = useIsSuperAdmin();

  return useQuery<CommerceProductType | null>({
    queryKey: ['admin', 'products', 'detail', id] as const,
    queryFn: () => (id ? api.get<CommerceProductType>(`/products/admin/${id}/`) : Promise.resolve(null)),
    enabled: computed(() => Boolean(id) && isSuperAdmin.value),
  });
}

export function useUpdateAdminProduct() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: number; payload: UpdateAdminProductPayload }) =>
      api.patch<CommerceProductType>(`/products/admin/${input.id}/`, input.payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useCreateAdminVariant() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { productId: number; payload: AdminVariantPayload }) =>
      api.post<CommerceVariant>(`/products/admin/${input.productId}/variants/create/`, input.payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products', 'detail', variables.productId] });
    },
  });
}

export function useUpdateAdminVariant() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { productId: number; variantId: number; payload: AdminVariantPayload }) =>
      api.patch<CommerceVariant>(`/products/admin/${input.productId}/variants/${input.variantId}/`, input.payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products', 'detail', variables.productId] });
    },
  });
}

export function useDeleteAdminVariant() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { productId: number; variantId: number }) =>
      api.delete(`/products/admin/${input.productId}/variants/${input.variantId}/`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products', 'detail', variables.productId] });
    },
  });
}
