<script setup lang="ts">
import { getOrderStatusMeta } from '~/lib/orderStatus';

definePageMeta({ layout: 'admin' });

const STATUS_OPTIONS = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'NEW', label: 'Yangi' },
  { value: 'PAYMENT_PENDING', label: 'To\'lov kutilmoqda' },
  { value: 'PAID', label: 'To\'langan' },
  { value: 'READY_FOR_PRODUCTION', label: 'Ishlab chiqarishga tayyor' },
  { value: 'IN_PRODUCTION', label: 'Ishlab chiqarilmoqda' },
  { value: 'QUALITY_CHECK', label: 'Sifat nazorati' },
  { value: 'READY_FOR_PICKUP', label: 'Olib ketishga tayyor' },
  { value: 'READY_FOR_DELIVERY', label: 'Yetkazishga tayyor' },
  { value: 'COMPLETED', label: 'Yakunlangan' },
  { value: 'CANCELLED', label: 'Bekor qilingan' },
];

const DELIVERY_OPTIONS = [
  { value: '', label: 'Barcha usullar' },
  { value: 'DELIVERY', label: 'Yetkazib berish' },
  { value: 'PICKUP', label: 'Kelib olib ketish' },
];

const status = ref('');
const deliveryMethod = ref('');
const search = ref('');
const page = ref(1);

const filters = computed(() => ({
  status: status.value || undefined,
  delivery_method: (deliveryMethod.value || undefined) as 'DELIVERY' | 'PICKUP' | undefined,
  search: search.value || undefined,
  page: page.value,
}));

const ordersQuery = useAdminOrders(filters);

watch([status, deliveryMethod, search], () => {
  page.value = 1;
});

const results = computed(() => ordersQuery.data.value?.results ?? []);

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ');
}
</script>

<template>
  <div>
    <p class="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-700">
      Admin
    </p>
    <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
      Buyurtmalar
    </h1>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <div class="relative">
        <Icon
          name="lucide:search"
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted"
        />
        <input
          v-model="search"
          placeholder="Order raqami, email, ism..."
          class="w-64 rounded-2xl border border-brand-border/60 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-secondary-400"
        >
      </div>
      <select
        v-model="status"
        class="rounded-2xl border border-brand-border/60 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary-400"
      >
        <option
          v-for="opt in STATUS_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <select
        v-model="deliveryMethod"
        class="rounded-2xl border border-brand-border/60 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary-400"
      >
        <option
          v-for="opt in DELIVERY_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div
      v-if="ordersQuery.isLoading.value"
      class="mt-6 h-64 animate-pulse rounded-3xl bg-brand-surface-low"
    />
    <div
      v-else-if="results.length === 0"
      class="mt-6 rounded-3xl border border-dashed border-brand-border bg-brand-surface-low/40 p-10 text-center"
    >
      <p class="text-base text-brand-muted">
        Hech qanday buyurtma topilmadi.
      </p>
    </div>
    <div
      v-else
      class="mt-6 grid gap-3"
    >
      <article
        v-for="order in results"
        :key="order.id"
        class="rounded-2xl border border-brand-border/50 bg-white p-5 shadow-sm transition hover:border-secondary-200"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2.5">
              <h2 class="text-lg font-bold text-slate-950">
                {{ order.order_number }}
              </h2>
              <span
                class="rounded-full border px-3 py-1 text-xs font-semibold"
                :class="getOrderStatusMeta(order.status).className"
              >
                {{ getOrderStatusMeta(order.status).label }}
              </span>
              <span class="inline-flex items-center gap-1 rounded-full border border-brand-border/60 bg-brand-surface-low px-3 py-1 text-xs font-semibold text-slate-600">
                <Icon
                  :name="order.delivery_method === 'PICKUP' ? 'lucide:store' : 'lucide:truck'"
                  class="h-3 w-3"
                />
                {{ order.delivery_method === 'PICKUP' ? 'Olib ketish' : 'Yetkazib berish' }}
              </span>
            </div>
            <p class="mt-1.5 text-sm text-brand-muted">
              {{ order.customer_name }} · {{ formatDate(order.created_at) }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <div class="rounded-2xl bg-brand-surface-low px-4 py-2.5 text-center">
              <p class="text-xs text-brand-muted">
                Mahsulot
              </p>
              <p class="mt-0.5 font-semibold text-slate-900">
                {{ order.item_count }}
              </p>
            </div>
            <div class="rounded-2xl bg-secondary-50 px-4 py-2.5 text-center">
              <p class="text-xs text-brand-muted">
                Jami
              </p>
              <p class="mt-0.5 font-semibold text-slate-900">
                {{ formatMoney(order.total_amount) }}
              </p>
            </div>
            <NuxtLink
              :to="`/admin/orders/${order.id}`"
              class="inline-flex items-center gap-1.5 rounded-2xl bg-secondary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-700"
            >
              Tafsilotlar
              <Icon
                name="lucide:arrow-right"
                class="h-3.5 w-3.5"
              />
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>

    <div
      v-if="ordersQuery.data.value && (ordersQuery.data.value.next || ordersQuery.data.value.previous)"
      class="mt-6 flex items-center justify-center gap-3"
    >
      <button
        type="button"
        :disabled="!ordersQuery.data.value.previous"
        class="rounded-2xl border border-brand-border/60 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-surface-low disabled:cursor-not-allowed disabled:opacity-50"
        @click="page = Math.max(1, page - 1)"
      >
        Oldingi
      </button>
      <span class="text-sm text-brand-muted">{{ page }}-sahifa</span>
      <button
        type="button"
        :disabled="!ordersQuery.data.value.next"
        class="rounded-2xl border border-brand-border/60 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-surface-low disabled:cursor-not-allowed disabled:opacity-50"
        @click="page = page + 1"
      >
        Keyingi
      </button>
    </div>
  </div>
</template>
