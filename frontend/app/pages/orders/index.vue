<script setup lang="ts">
import { getOrderStatusMeta } from '~/lib/orderStatus';

const route = useRoute();
const loginHref = computed(() => `/login?redirect=${encodeURIComponent(route.fullPath)}`);
const authState = useAuthState();
const ordersQuery = useOrders();
const statsQuery = useOrderStats();

const orders = computed(() => ordersQuery.data.value ?? []);
const stats = computed(() => statsQuery.data.value ?? null);
const loading = computed(() => ordersQuery.isLoading.value || statsQuery.isLoading.value);
const error = computed(() => (ordersQuery.isError.value || statsQuery.isError.value ? 'Buyurtmalarni yuklashda xatolik yuz berdi.' : null));

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ');
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-700">
        Buyurtmalar
      </p>
      <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
        Buyurtmalar tarixi
      </h1>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
        Checkoutdan keyingi barcha buyurtmalar va ularning holatlari.
      </p>
    </div>

    <div
      v-if="loading"
      class="mt-8 h-64 animate-pulse rounded-3xl bg-brand-surface-low"
    />

    <div
      v-else-if="!authState"
      class="mt-8 rounded-3xl border border-brand-border/50 bg-white p-8 text-center shadow-sm"
    >
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary-50 text-secondary-700">
        <Icon
          name="lucide:shopping-bag"
          class="h-7 w-7"
        />
      </div>
      <h2 class="mt-5 text-xl font-bold text-slate-900">
        Buyurtmalar hisob bilan bog'langan
      </h2>
      <p class="mt-2 text-sm leading-6 text-brand-muted">
        Buyurtmalar tarixini ko'rish uchun hisobga kiring.
      </p>
      <NuxtLink
        :to="loginHref"
        class="mt-6 rounded-2xl bg-secondary-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-secondary-700"
      >
        Hisobga kirish
      </NuxtLink>
    </div>

    <template v-else>
      <p
        v-if="error"
        class="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        {{ error }}
      </p>

      <div
        v-if="stats"
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
            <span class="text-xs text-brand-muted">Umumiy sarf</span>
          </div>
          <p class="mt-3 text-xl font-extrabold text-slate-950">
            {{ formatMoney(stats.total_spent || 0) }}
          </p>
        </div>
      </div>

      <div
        v-if="orders.length === 0"
        class="mt-8 rounded-3xl border border-dashed border-brand-border bg-brand-surface-low/40 p-10 text-center"
      >
        <h2 class="text-xl font-bold text-slate-900">
          Hali buyurtma yo'q
        </h2>
        <p class="mt-2 text-sm leading-6 text-brand-muted">
          Mahsulot sahifasida dizaynni tayyorlab savatga qo'shing.
        </p>
        <NuxtLink
          to="/"
          class="mt-6 inline-flex items-center gap-2 rounded-2xl bg-secondary-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-secondary-700"
        >
          Mahsulotlarni ko'rish
          <Icon
            name="lucide:arrow-right"
            class="h-4 w-4"
          />
        </NuxtLink>
      </div>

      <div
        v-else
        class="mt-6 grid gap-3"
      >
        <article
          v-for="order in orders"
          :key="order.order_number"
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
              </div>
              <p class="mt-1.5 text-sm text-brand-muted">
                {{ formatDate(order.created_at) }}
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
                :to="`/orders/${order.order_number}`"
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
    </template>
  </div>
</template>
