import { useQuery } from '@tanstack/react-query';
import {
  getProductionCenters,
  type ProductionCenterFilters,
} from '@/lib/commerce';
import { queryKeys } from '@/lib/queryClient';

export function useProductionCenters(filters: ProductionCenterFilters = {}) {
  return useQuery({
    queryKey: queryKeys.productionCenters(filters),
    queryFn: () => getProductionCenters(filters),
    staleTime: 60_000,
  });
}
