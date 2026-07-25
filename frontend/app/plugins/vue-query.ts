import {
  VueQueryPlugin,
  QueryClient,
  hydrate,
  dehydrate,
} from '@tanstack/vue-query';
import type { DehydratedState } from '@tanstack/vue-query';

// Same data-fetching model as the previous frontend's `hooks/queries.ts`
// (TanStack Query) — caching, refetch-on-focus, mutation invalidation —
// just the Vue binding instead of the React one. Wired for Nuxt SSR via
// `useState`, which is the payload channel Nuxt already knows how to
// serialize safely (dehydrate() only after the app has actually
// rendered, so every query fired during SSR is captured).
export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });

  const vueQueryState = useState<DehydratedState | null>('vue-query', () => null);

  if (import.meta.server) {
    nuxtApp.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient);
    });
  }

  if (import.meta.client && vueQueryState.value) {
    hydrate(queryClient, vueQueryState.value);
  }
});
