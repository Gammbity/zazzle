<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi';
import { getOrderStatusMeta } from '~/lib/orderStatus';
import type { PaymentInitResult } from '~/types/commerce';

const PAYMENT_PROVIDERS = [
  { value: 'payme' as const, label: 'Payme' },
  { value: 'click' as const, label: 'Click' },
  { value: 'uzcard_humo' as const, label: 'Uzcard / Humo' },
];

const route = useRoute();
const orderLookup = computed(() => String(route.params.id));

const loginHref = computed(() => `/login?redirect=${encodeURIComponent(route.fullPath)}`);
const authState = useAuthState();
const orderQuery = useOrder(orderLookup.value);
const paymentMutation = useInitPayment();
const cancelMutation = useCancelOrder();

const paymentResult = ref<PaymentInitResult | null>(null);
const actionError = ref<string | null>(null);

const order = computed(() => orderQuery.data.value ?? null);
const loading = computed(() => orderQuery.isLoading.value);
const error = computed(() => actionError.value ?? (orderQuery.isError.value ? 'Buyurtma tafsilotlarini yuklab bo\'lmadi.' : null));
const statusMeta = computed(() => getOrderStatusMeta(order.value?.status || 'NEW'));
const canRetryPayment = computed(() => order.value?.status === 'NEW' || order.value?.status === 'PAYMENT_PENDING');

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ');
}

function createIdempotencyKey() {
  return `${orderLookup.value}-${crypto.randomUUID()}`;
}

async function handlePaymentInit(provider: 'payme' | 'click' | 'uzcard_humo') {
  if (!order.value) return;
  actionError.value = null;
  try {
    paymentResult.value = await paymentMutation.mutateAsync({
      orderId: order.value.id,
      provider,
      idempotencyKey: createIdempotencyKey(),
    });
  }
  catch (paymentError) {
    actionError.value = getApiErrorMessage(paymentError, 'To\'lovni qayta boshlashda xatolik.');
  }
}

async function handleCancel() {
  if (!order.value) return;
  actionError.value = null;
  try {
    await cancelMutation.mutateAsync(order.value.id);
    await orderQuery.refetch();
  }
  catch {
    actionError.value = 'Buyurtmani bekor qilib bo\'lmadi.';
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <NuxtLink
      to="/orders"
      class="inline-flex items-center gap-2 rounded-full border border-brand-border/60 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-surface-low"
    >
      <Icon
        name="lucide:arrow-left"
        class="h-4 w-4"
      />
      Buyurtmalar ro'yxati
    </NuxtLink>

    <div
      v-if="loading"
      class="mt-8 h-64 animate-pulse rounded-3xl bg-brand-surface-low"
    />

    <div
      v-else-if="!authState"
      class="mt-8 rounded-3xl border border-brand-border/50 bg-white p-8 text-center shadow-sm"
    >
      <h1 class="text-xl font-bold text-slate-900">
        Buyurtma tafsilotlari uchun kirish talab qilinadi
      </h1>
      <NuxtLink
        :to="loginHref"
        class="mt-6 rounded-2xl bg-secondary-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-secondary-700"
      >
        Hisobga kirish
      </NuxtLink>
    </div>

    <div
      v-else-if="!order"
      class="mt-8 rounded-3xl border border-dashed border-brand-border bg-brand-surface-low/40 p-10 text-center"
    >
      <h1 class="text-xl font-bold text-slate-900">
        Buyurtma topilmadi
      </h1>
      <p class="mt-2 text-sm leading-6 text-brand-muted">
        Buyurtma raqamini tekshiring yoki buyurtmalar ro'yxatiga qayting.
      </p>
    </div>

    <template v-else>
      <div class="mt-8 rounded-3xl border border-brand-border/50 bg-white p-6 shadow-sm sm:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-700">
              Buyurtma tafsiloti
            </p>
            <h1 class="mt-2 text-3xl font-extrabold text-slate-950">
              {{ order.order_number }}
            </h1>
            <p class="mt-2 text-sm text-brand-muted">
              {{ formatDate(order.created_at) }} da yaratilgan
            </p>
          </div>
          <span
            class="rounded-full border px-4 py-2 text-sm font-semibold"
            :class="statusMeta.className"
          >
            {{ statusMeta.label }}
          </span>
        </div>
      </div>

      <p
        v-if="error"
        class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        {{ error }}
      </p>

      <div class="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="space-y-6">
          <section class="rounded-3xl border border-brand-border/50 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900">
              Buyurtmadagi mahsulotlar
            </h2>
            <div class="mt-4 space-y-3">
              <article
                v-for="item in order.items"
                :key="item.id"
                class="rounded-2xl border border-brand-border/40 bg-brand-surface-low/60 p-4"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 class="font-semibold text-slate-900">
                      {{ item.product_name }}
                    </h3>
                    <p class="mt-0.5 text-sm text-brand-muted">
                      {{ item.design_title || 'Dizayn nomi kiritilmagan' }}
                    </p>
                    <div class="mt-2 flex flex-wrap gap-3 text-xs text-brand-muted">
                      <span>Variant: {{ [item.size, item.color].filter(Boolean).join(' · ') || 'Standart' }}</span>
                      <span>Soni: {{ item.quantity }}</span>
                      <span>Bir dona: {{ formatMoney(item.unit_price) }}</span>
                    </div>
                    <p class="mt-1.5 text-xs text-brand-muted/70">
                      Ishlab chiqarish: {{ item.production_status }}
                    </p>
                  </div>
                  <div class="rounded-2xl bg-secondary-50 px-4 py-3 text-right">
                    <p class="text-xs text-brand-muted">
                      Jami
                    </p>
                    <p class="mt-1 text-lg font-bold text-slate-900">
                      {{ formatMoney(item.total_price) }}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section class="rounded-3xl border border-brand-border/50 bg-white p-6 shadow-sm">
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700">
                <Icon
                  name="lucide:map-pin"
                  class="h-4 w-4"
                />
              </div>
              <h2 class="text-lg font-bold text-slate-900">
                Yetkazib berish
              </h2>
            </div>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl bg-brand-surface-low p-4">
                <p class="text-xs text-brand-muted">
                  Qabul qiluvchi
                </p>
                <p class="mt-1.5 font-semibold text-slate-900">
                  {{ order.shipping_name }}
                </p>
                <p class="mt-0.5 text-sm text-brand-muted">
                  {{ order.shipping_email }}
                </p>
                <p class="mt-0.5 text-sm text-brand-muted">
                  {{ order.shipping_phone || 'Telefon kiritilmagan' }}
                </p>
              </div>
              <div class="rounded-2xl bg-brand-surface-low p-4">
                <p class="text-xs text-brand-muted">
                  Manzil
                </p>
                <p class="mt-1.5 font-semibold text-slate-900">
                  {{ order.shipping_address || 'Manzil kiritilmagan' }}
                </p>
                <p class="mt-0.5 text-sm text-brand-muted">
                  {{ [order.shipping_city, order.shipping_state].filter(Boolean).join(', ') }}
                </p>
                <p class="mt-0.5 text-sm text-brand-muted">
                  {{ [order.shipping_postal_code, order.shipping_country].filter(Boolean).join(' · ') }}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside class="h-fit space-y-5">
          <section class="rounded-2xl bg-gradient-to-br from-secondary-700 to-brand-dim p-6 text-white shadow-xl">
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
              Buyurtma xulosasi
            </p>
            <div class="mt-5 space-y-3 rounded-2xl border border-white/15 bg-white/10 p-5">
              <div class="flex items-center justify-between text-sm text-white/85">
                <span>Oraliq summa</span>
                <span>{{ formatMoney(order.subtotal) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm text-white/85">
                <span>Yetkazib berish</span>
                <span>{{ Number.parseFloat(order.shipping_cost) > 0 ? formatMoney(order.shipping_cost) : '0 UZS' }}</span>
              </div>
              <div
                v-if="Number.parseFloat(order.discount_amount) > 0"
                class="flex items-center justify-between text-sm text-white/85"
              >
                <span>Chegirma</span>
                <span>−{{ formatMoney(order.discount_amount) }}</span>
              </div>
              <div class="border-t border-white/15 pt-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-white/70">Jami</span>
                  <span class="text-2xl font-extrabold">{{ formatMoney(order.total_amount) }}</span>
                </div>
              </div>
            </div>

            <div
              v-if="canRetryPayment"
              class="mt-5 rounded-2xl border border-white/15 bg-white/10 p-5"
            >
              <div class="flex items-center gap-2.5">
                <Icon
                  name="lucide:credit-card"
                  class="h-4 w-4 text-white/70"
                />
                <p class="text-sm font-semibold text-white">
                  To'lovni boshlash
                </p>
              </div>
              <div class="mt-4 grid gap-2">
                <button
                  v-for="p in PAYMENT_PROVIDERS"
                  :key="p.value"
                  type="button"
                  :disabled="paymentMutation.isPending.value"
                  class="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-secondary-800 transition hover:bg-secondary-50 disabled:opacity-60"
                  @click="handlePaymentInit(p.value)"
                >
                  {{ p.label }}
                </button>
              </div>

              <a
                v-if="paymentResult?.provider_payload.redirect_url"
                :href="String(paymentResult.provider_payload.redirect_url)"
                target="_blank"
                rel="noreferrer"
                class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-700"
              >
                <Icon
                  name="lucide:external-link"
                  class="h-3.5 w-3.5"
                />
                Provider sahifasini ochish
              </a>
            </div>
          </section>

          <section class="rounded-2xl border border-brand-border/50 bg-white p-6 shadow-sm">
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700">
                <Icon
                  name="lucide:truck"
                  class="h-4 w-4"
                />
              </div>
              <h2 class="text-base font-bold text-slate-900">
                Harakatlar
              </h2>
            </div>
            <div class="mt-4 flex flex-col gap-2.5">
              <button
                v-if="order.status !== 'COMPLETED' && order.status !== 'CANCELLED'"
                type="button"
                :disabled="cancelMutation.isPending.value"
                class="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                @click="handleCancel"
              >
                <Icon
                  name="lucide:x-circle"
                  class="h-4 w-4"
                />
                {{ cancelMutation.isPending.value ? 'Bekor qilinmoqda...' : 'Buyurtmani bekor qilish' }}
              </button>
              <NuxtLink
                to="/orders"
                class="rounded-2xl border border-brand-border/60 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-brand-surface-low"
              >
                Barcha buyurtmalar
              </NuxtLink>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
