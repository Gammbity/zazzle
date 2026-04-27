import { useQuery } from '@tanstack/react-query';
import {
  fetchCommerceProductBySlug,
  type CommerceProductType,
} from '@/lib/commerce';
import { queryKeys } from '@/lib/queryClient';

export function useCommerceProduct(slug: string | undefined) {
  return useQuery<CommerceProductType | null>({
    queryKey: slug
      ? queryKeys.commerceProduct(slug)
      : ['commerceProduct', 'none'],
    queryFn: () =>
      slug ? fetchCommerceProductBySlug(slug) : Promise.resolve(null),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
  });
}
