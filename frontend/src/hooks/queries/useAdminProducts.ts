import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminVariant,
  deleteAdminProduct,
  deleteAdminVariant,
  getAdminProduct,
  getAdminProducts,
  updateAdminProduct,
  updateAdminVariant,
  type AdminProductFilters,
  type AdminVariantPayload,
  type UpdateAdminProductPayload,
} from '@/lib/adminApi';
import { queryKeys } from '@/lib/queryClient';
import { useCanManageProducts } from '@/hooks/queries/useAuth';

export function useAdminProducts(filters: AdminProductFilters = {}) {
  const canManageProducts = useCanManageProducts();
  return useQuery({
    queryKey: queryKeys.adminProducts(filters),
    queryFn: () => getAdminProducts(filters),
    enabled: canManageProducts,
  });
}

export function useAdminProduct(id: number | string | undefined) {
  const canManageProducts = useCanManageProducts();
  return useQuery({
    queryKey: queryKeys.adminProduct(id ?? 'none'),
    queryFn: () => getAdminProduct(id as number | string),
    enabled: Boolean(id) && canManageProducts,
  });
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: UpdateAdminProductPayload;
    }) => updateAdminProduct(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminProduct(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useDeleteAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useCreateAdminVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: number | string;
      payload: AdminVariantPayload;
    }) => createAdminVariant(productId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminProduct(variables.productId),
      });
    },
  });
}

export function useUpdateAdminVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      payload,
    }: {
      productId: number | string;
      variantId: number | string;
      payload: AdminVariantPayload;
    }) => updateAdminVariant(productId, variantId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminProduct(variables.productId),
      });
    },
  });
}

export function useDeleteAdminVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      variantId,
    }: {
      productId: number | string;
      variantId: number | string;
    }) => deleteAdminVariant(productId, variantId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminProduct(variables.productId),
      });
    },
  });
}
