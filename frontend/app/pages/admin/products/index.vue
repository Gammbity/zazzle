<script setup lang="ts">
definePageMeta({ layout: 'admin' });

const productsQuery = useAdminProducts();
const products = computed(() => {
  const data = productsQuery.data.value;
  if (!data) return [];
  return Array.isArray(data) ? data : data.results;
});
</script>

<template>
  <div>
    <p class="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-700">
      Admin
    </p>
    <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
      Mahsulotlar
    </h1>
    <p class="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
      Mahsulot turlari va ularning variantlarini boshqaring.
    </p>

    <div
      v-if="productsQuery.isLoading.value"
      class="mt-8 h-64 animate-pulse rounded-3xl bg-brand-surface-low"
    />
    <div
      v-else-if="products.length === 0"
      class="mt-8 rounded-3xl border border-dashed border-brand-border bg-brand-surface-low/40 p-10 text-center"
    >
      <p class="text-base text-brand-muted">
        Mahsulot topilmadi.
      </p>
    </div>
    <div
      v-else
      class="mt-6 grid gap-3"
    >
      <article
        v-for="product in products"
        :key="product.id"
        class="rounded-2xl border border-brand-border/50 bg-white p-5 shadow-sm transition hover:border-secondary-200"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-700">
              <Icon
                name="lucide:package"
                class="h-4 w-4"
              />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2.5">
                <h2 class="text-lg font-bold text-slate-950">
                  {{ product.name }}
                </h2>
                <span
                  class="rounded-full border px-3 py-1 text-xs font-semibold"
                  :class="product.is_active ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-slate-200 bg-slate-100 text-slate-600'"
                >
                  {{ product.is_active ? 'Faol' : 'Faol emas' }}
                </span>
              </div>
              <p class="mt-1 text-sm text-brand-muted">
                {{ product.variant_count ?? product.variants?.length ?? 0 }} ta variant
              </p>
            </div>
          </div>

          <NuxtLink
            :to="`/admin/products/${product.id}`"
            class="inline-flex items-center gap-1.5 rounded-2xl bg-secondary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-700"
          >
            Tahrirlash
            <Icon
              name="lucide:arrow-right"
              class="h-3.5 w-3.5"
            />
          </NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>
