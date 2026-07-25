<script setup lang="ts">
definePageMeta({ layout: 'admin' });

const DAY_RANGE_OPTIONS = [7, 14, 30] as const;

const statsQuery = useOrderStats();
const stats = computed(() => statsQuery.data.value ?? null);

const days = ref<(typeof DAY_RANGE_OPTIONS)[number]>(14);
const analyticsQuery = useOrderAnalytics(days);
const analytics = computed(() => analyticsQuery.data.value ?? null);

const revenueData = computed(() => analytics.value?.revenue_by_day.map(point => ({
  date: point.date,
  revenue: Number(point.revenue),
  orders: point.orders,
})) ?? []);

const statusData = computed(() => analytics.value?.orders_by_status
  .filter(row => row.count > 0)
  .map(row => ({ label: row.label, value: row.count })) ?? []);

const topProductsData = computed(() => analytics.value?.top_products.map(product => ({
  label: product.product_name,
  value: product.units_sold,
  valueLabel: `${product.units_sold} dona`,
})) ?? []);

const deliveryMethodData = computed(() => analytics.value?.orders_by_delivery_method.map(row => ({
  label: row.label,
  value: row.count,
})) ?? []);

const centerData = computed(() => analytics.value?.orders_by_center.map(row => ({
  label: row.center,
  value: row.count,
})) ?? []);
</script>

<template>
  <div>
    <p class="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-700">
      Admin
    </p>
    <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
      Dashboard
    </h1>
    <p class="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
      Buyurtmalar va do'kon holati bo'yicha umumiy ko'rinish.
    </p>

    <div
      v-if="statsQuery.isLoading.value"
      class="mt-8 h-40 animate-pulse rounded-3xl bg-brand-surface-low"
    />
    <div
      v-else-if="stats"
      class="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4"
    >
      <div class="rounded-2xl bg-gradient-to-br from-secondary-700 to-brand-dim p-5 text-white shadow-lg">
        <div class="flex items-center gap-2.5">
          <Icon
            name="lucide:boxes"
            class="h-4 w-4 text-white/70"
          />
          <span class="text-xs text-white/70">Jami buyurtma</span>
        </div>
        <p class="mt-3 text-3xl font-extrabold">
          {{ stats.total_orders }}
        </p>
      </div>
      <div class="rounded-2xl border border-brand-border/50 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-2.5">
          <Icon
            name="lucide:credit-card"
            class="h-4 w-4 text-secondary-600"
          />
          <span class="text-xs text-brand-muted">To'lov kutilmoqda</span>
        </div>
        <p class="mt-3 text-3xl font-extrabold text-slate-950">
          {{ stats.payment_pending_orders }}
        </p>
      </div>
      <div class="rounded-2xl border border-brand-border/50 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-2.5">
          <Icon
            name="lucide:package-search"
            class="h-4 w-4 text-secondary-600"
          />
          <span class="text-xs text-brand-muted">Ishlab chiqarishda</span>
        </div>
        <p class="mt-3 text-3xl font-extrabold text-slate-950">
          {{ stats.in_production_orders }}
        </p>
      </div>
      <div class="rounded-2xl border border-brand-border/50 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-2.5">
          <Icon
            name="lucide:wallet"
            class="h-4 w-4 text-emerald-600"
          />
          <span class="text-xs text-brand-muted">Umumiy tushum</span>
        </div>
        <p class="mt-3 text-xl font-extrabold text-slate-950">
          {{ formatMoney(stats.total_revenue || 0) }}
        </p>
      </div>
    </div>

    <div class="mt-10 flex items-center justify-between">
      <p class="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-700">
        Analitika
      </p>
      <div class="inline-flex rounded-full border border-brand-border/60 bg-white p-1">
        <button
          v-for="option in DAY_RANGE_OPTIONS"
          :key="option"
          type="button"
          class="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="days === option ? 'bg-secondary-600 text-white' : 'text-brand-muted hover:text-slate-900'"
          @click="days = option"
        >
          {{ option }} kun
        </button>
      </div>
    </div>

    <div class="mt-4 rounded-2xl border border-brand-border/50 bg-white p-6 shadow-sm">
      <p class="text-sm font-semibold text-slate-900">
        Kunlik tushum
      </p>
      <p class="mt-0.5 text-xs text-brand-muted">
        Oxirgi {{ days }} kunlik tushum va buyurtmalar soni dinamikasi.
      </p>
      <div class="mt-4">
        <div
          v-if="analyticsQuery.isLoading.value"
          class="h-56 animate-pulse rounded-2xl bg-brand-surface-low"
        />
        <RevenueTrendChart
          v-else
          :data="revenueData"
        />
      </div>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl border border-brand-border/50 bg-white p-6 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">
          Buyurtmalar holati bo'yicha
        </p>
        <p class="mt-0.5 text-xs text-brand-muted">
          Har bir bosqichda nechta buyurtma turgani.
        </p>
        <div class="mt-4">
          <div
            v-if="analyticsQuery.isLoading.value"
            class="h-56 animate-pulse rounded-2xl bg-brand-surface-low"
          />
          <HorizontalBarChart
            v-else
            :data="statusData"
          />
        </div>
      </div>

      <div class="rounded-2xl border border-brand-border/50 bg-white p-6 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">
          Top mahsulotlar
        </p>
        <p class="mt-0.5 text-xs text-brand-muted">
          Eng ko'p sotilgan mahsulotlar (dona bo'yicha).
        </p>
        <div class="mt-4">
          <div
            v-if="analyticsQuery.isLoading.value"
            class="h-56 animate-pulse rounded-2xl bg-brand-surface-low"
          />
          <HorizontalBarChart
            v-else
            :data="topProductsData"
          />
        </div>
      </div>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl border border-brand-border/50 bg-white p-6 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">
          Yetkazib berish usuli
        </p>
        <p class="mt-0.5 text-xs text-brand-muted">
          Pochta orqali yetkazib berish va o'zi olib ketish nisbati.
        </p>
        <div class="mt-4">
          <div
            v-if="analyticsQuery.isLoading.value"
            class="h-24 animate-pulse rounded-2xl bg-brand-surface-low"
          />
          <HorizontalBarChart
            v-else
            :data="deliveryMethodData"
          />
        </div>
      </div>

      <div class="rounded-2xl border border-brand-border/50 bg-white p-6 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">
          Ishlab chiqarish markazlari bo'yicha
        </p>
        <p class="mt-0.5 text-xs text-brand-muted">
          Har bir markazga tushgan buyurtmalar soni.
        </p>
        <div class="mt-4">
          <div
            v-if="analyticsQuery.isLoading.value"
            class="h-24 animate-pulse rounded-2xl bg-brand-surface-low"
          />
          <HorizontalBarChart
            v-else
            :data="centerData"
          />
        </div>
      </div>
    </div>

    <div class="mt-8 grid gap-4 sm:grid-cols-2">
      <NuxtLink
        to="/admin/orders"
        class="flex items-center gap-4 rounded-2xl border border-brand-border/50 bg-white p-6 shadow-sm transition hover:border-secondary-200"
      >
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-700">
          <Icon
            name="lucide:clipboard-list"
            class="h-5 w-5"
          />
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-900">
            Buyurtmalarni boshqarish
          </p>
          <p class="mt-0.5 text-xs text-brand-muted">
            Holat, dastavka usuli, tayinlash
          </p>
        </div>
      </NuxtLink>
      <NuxtLink
        to="/admin/products"
        class="flex items-center gap-4 rounded-2xl border border-brand-border/50 bg-white p-6 shadow-sm transition hover:border-secondary-200"
      >
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-700">
          <Icon
            name="lucide:package"
            class="h-5 w-5"
          />
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-900">
            Mahsulotlarni boshqarish
          </p>
          <p class="mt-0.5 text-xs text-brand-muted">
            Narx, variantlar, faollik
          </p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
