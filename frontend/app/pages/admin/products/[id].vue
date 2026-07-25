<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi';

definePageMeta({ layout: 'admin' });

const route = useRoute();
const productId = computed(() => Number(route.params.id));

const productQuery = useAdminProduct(productId.value);
const product = computed(() => productQuery.data.value ?? null);
const updateProductMutation = useUpdateAdminProduct();

const form = reactive({ name: '', description: '', is_active: true });
const error = ref<string | null>(null);

watch(product, (newProduct) => {
  if (!newProduct) return;
  form.name = newProduct.name;
  form.description = newProduct.description;
  form.is_active = newProduct.is_active ?? true;
}, { immediate: true });

async function handleSave() {
  if (!product.value) return;
  error.value = null;
  try {
    await updateProductMutation.mutateAsync({ id: product.value.id, payload: { ...form } });
  }
  catch (err) {
    error.value = getApiErrorMessage(err, 'Saqlab bo\'lmadi.');
  }
}
</script>

<template>
  <div>
    <NuxtLink
      to="/admin/products"
      class="inline-flex items-center gap-2 rounded-full border border-brand-border/60 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-surface-low"
    >
      <Icon
        name="lucide:arrow-left"
        class="h-4 w-4"
      />
      Mahsulotlar
    </NuxtLink>

    <div
      v-if="productQuery.isLoading.value"
      class="mt-8 h-96 animate-pulse rounded-3xl bg-brand-surface-low"
    />

    <div
      v-else-if="!product"
      class="mt-8 rounded-3xl border border-dashed border-brand-border bg-brand-surface-low/40 p-10 text-center"
    >
      <h1 class="text-xl font-bold text-slate-900">
        Mahsulot topilmadi
      </h1>
    </div>

    <template v-else>
      <h1 class="mt-6 text-3xl font-extrabold tracking-tight text-slate-950">
        {{ product.name }}
      </h1>

      <p
        v-if="error"
        class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        {{ error }}
      </p>

      <section class="mt-6 rounded-3xl border border-brand-border/50 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">
          Umumiy ma'lumot
        </h2>
        <div class="mt-4 space-y-3">
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium text-slate-700">Nomi</span>
            <input
              v-model="form.name"
              class="w-full rounded-xl border border-brand-border/60 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary-400"
            >
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium text-slate-700">Tavsif</span>
            <textarea
              v-model="form.description"
              class="min-h-20 w-full resize-none rounded-xl border border-brand-border/60 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary-400"
            />
          </label>
          <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              v-model="form.is_active"
              type="checkbox"
            >
            Faol (katalogda ko'rinadi)
          </label>
          <button
            type="button"
            :disabled="updateProductMutation.isPending.value"
            class="inline-flex items-center gap-2 rounded-2xl bg-secondary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-700 disabled:opacity-60"
            @click="handleSave"
          >
            <Icon
              name="lucide:save"
              class="h-4 w-4"
            />
            {{ updateProductMutation.isPending.value ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </section>

      <section class="mt-6 rounded-3xl border border-brand-border/50 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">
          Variantlar
        </h2>
        <div class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr class="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <th class="pb-2 pr-2 font-medium">
                  O'lcham
                </th>
                <th class="pb-2 pr-2 font-medium">
                  Rang
                </th>
                <th class="pb-2 pr-2 font-medium">
                  Hex
                </th>
                <th class="pb-2 pr-2 font-medium">
                  Narx
                </th>
                <th class="pb-2 pr-2 font-medium">
                  Tannarx
                </th>
                <th class="pb-2 pr-2 font-medium">
                  Zaxira
                </th>
                <th class="pb-2 pr-2 font-medium">
                  Faol
                </th>
                <th class="pb-2 pl-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              <AdminVariantRow
                v-for="variant in product.variants"
                :key="variant.id"
                :product-id="product.id"
                :variant="variant"
              />
              <AdminNewVariantRow :product-id="product.id" />
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
