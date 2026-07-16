import { useQuery } from '@tanstack/react-query';
import { getPickupLocations } from '@/lib/commerce';
import { queryKeys } from '@/lib/queryClient';

export function usePickupLocations() {
  return useQuery({
    queryKey: queryKeys.pickupLocations,
    queryFn: getPickupLocations,
    staleTime: 5 * 60_000,
  });
}
