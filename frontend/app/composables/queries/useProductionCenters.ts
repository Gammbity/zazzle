import { useQuery } from '@tanstack/vue-query';
import { queryKeys } from '~/lib/queryKeys';
import type { DeliveryMethod, ListResponse, ProductionCenter } from '~/types/commerce';

export interface ProductionCenterFilters {
  delivery_method?: DeliveryMethod;
  [key: string]: unknown;
}

export function useProductionCenters(filters: ProductionCenterFilters = {}) {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.productionCenters(filters),
    queryFn: async () => {
      const response = await api.get<ListResponse<ProductionCenter>>('/production-centers/', filters);
      return Array.isArray(response) ? response : (response.results ?? []);
    },
    staleTime: 60_000,
  });
}
