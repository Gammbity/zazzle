<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi';
import type { CheckoutResult, DeliveryMethod, PaymentInitResult } from '~/types/commerce';

type PaymentProvider = 'payme' | 'click' | 'uzcard_humo';

const PROVIDERS: Array<{ value: PaymentProvider; title: string; description: string }> = [
  { value: 'payme', title: 'Payme', description: 'Payme sahifasiga yo\'naltirilasiz.' },
  { value: 'click', title: 'Click', description: 'Click to\'lov oynasiga o\'tiladi.' },
  { value: 'uzcard_humo', title: 'Uzcard / Humo', description: 'Mahalliy karta orqali to\'lov.' },
];

const route = useRoute();
const loginHref = computed(() => `/login?redirect=${encodeURIComponent(route.fullPath)}`);
const authState = useAuthState();
const cartQuery = useCart();
const userQuery = useCurrentUser();
const checkoutMutation = useCheckout();
const paymentMutation = useInitPayment();

const provider = ref<PaymentProvider>('payme');
const submitError = ref<string | null>(null);
const paymentInitError = ref<string | null>(null);
const result = ref<{ checkout: CheckoutResult; payment: PaymentInitResult | null } | null>(null);

const form = reactive({
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  delivery_method: 'DELIVERY' as DeliveryMethod,
  production_center: null as number | null,
  shipping_address: '',
  shipping_city: 'Tashkent',
  shipping_state: 'Tashkent',
  shipping_postal_code: '100000',
  shipping_country: 'Uzbekistan',
  customer_notes: '',
});

const centersQuery = useProductionCenters({ delivery_method: form.delivery_method });
const centers = computed(() => centersQuery.data.value ?? []);

watch(() => form.delivery_method, () => {
  form.production_center = null;
});

watch(userQuery.data, (user) => {
  if (!user) return;
  const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
  form.contact_name ||= fullName;
  form.contact_email ||= user.email || '';
  form.contact_phone ||= user.profile?.phone_number || '';
}, { immediate: true });

const cart = computed(() => (result.value ? null : (cartQuery.data.value ?? null)));
const loading = computed(() => cartQuery.isLoading.value || userQuery.isLoading.value);
const submitting = computed(() => checkoutMutation.isPending.value || paymentMutation.isPending.value);
const error = computed(() => submitError.value
  ?? (cartQuery.isError.value ? getApiErrorMessage(cartQuery.error.value, 'Checkout ma\'lumotlarini yuklab bo\'lmadi.') : null));

const canSubmit = computed(() => Boolean(
  cart.value
  && !cart.value.is_empty
  && form.contact_name
  && form.contact_email
  && form.contact_phone
  && form.production_center
  && (form.delivery_method === 'PICKUP' || form.shipping_address),
));

function createIdempotencyKey() {
  return crypto.randomUUID();
}

async function handleSubmit() {
  if (!canSubmit.value) return;
  submitError.value = null;
  paymentInitError.value = null;

  try {
    const checkout = await checkoutMutation.mutateAsync({ ...form });
    let payment: PaymentInitResult | null = null;

    try {
      payment = await paymentMutation.mutateAsync({
        orderId: checkout.order_id,
        provider: provider.value,
        idempotencyKey: createIdempotencyKey(),
      });
    }
    catch (paymentError) {
      paymentInitError.value = getApiErrorMessage(paymentError, 'Buyurtma yaratildi, lekin to\'lov init bosqichida xatolik bo\'ldi.');
    }

    result.value = { checkout, payment };
  }
  catch (checkoutError) {
    submitError.value = getApiErrorMessage(checkoutError, 'Checkoutni yakunlab bo\'lmadi.');
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div
      v-if="result"
      class="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-sm"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Icon
            name="lucide:check-circle-2"
            class="h-6 w-6"
          />
        </div>
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Buyurtma tayyor
          </p>
          <h1 class="text-2xl font-extrabold text-slate-950">
            Buyurtma qabul qilindi
          </h1>
        </div>
      </div>

      <p class="mt-4 text-base leading-7 text-slate-600">
        Buyurtma raqami: <strong class="font-semibold text-slate-900">{{ result.checkout.order_number }}</strong>
      </p>

      <div class="mt-6 grid gap-4 sm:grid-cols-3">
        <div class="rounded-2xl border border-emerald-100 bg-white p-4">
          <p class="text-xs text-brand-muted">
            Jami summa
          </p>
          <p class="mt-1.5 text-xl font-bold text-slate-900">
            {{ formatMoney(result.checkout.total_amount) }}
          </p>
        </div>
        <div class="rounded-2xl border border-emerald-100 bg-white p-4">
          <p class="text-xs text-brand-muted">
            Holat
          </p>
          <p class="mt-1.5 text-xl font-bold text-slate-900">
            {{ result.checkout.status }}
          </p>
        </div>
        <div class="rounded-2xl border border-emerald-100 bg-white p-4">
          <p class="text-xs text-brand-muted">
            To'lov
          </p>
          <p class="mt-1.5 text-xl font-bold text-slate-900">
            {{ result.payment?.transaction.provider || provider }}
          </p>
        </div>
      </div>

      <div
        v-if="paymentInitError"
        class="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"
      >
        <p class="text-sm font-semibold text-amber-900">
          To'lov hozircha ishga tushmadi
        </p>
        <p class="mt-2 text-sm leading-6 text-amber-800">
          {{ paymentInitError }}
        </p>
      </div>

      <div
        v-if="result.payment?.provider_payload.redirect_url"
        class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5"
      >
        <p class="text-sm font-semibold text-amber-900">
          To'lovni davom ettirish havolasi tayyor
        </p>
        <a
          :href="String(result.payment.provider_payload.redirect_url)"
          target="_blank"
          rel="noreferrer"
          class="mt-4 inline-flex items-center gap-2 rounded-2xl bg-secondary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-700"
        >
          Provider sahifasini ochish
          <Icon
            name="lucide:arrow-right"
            class="h-4 w-4"
          />
        </a>
      </div>

      <div class="mt-6 flex flex-wrap gap-3">
        <NuxtLink
          :to="`/orders/${result.checkout.order_number}`"
          class="rounded-2xl bg-secondary-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-secondary-700"
        >
          Buyurtma tafsilotlari
        </NuxtLink>
        <NuxtLink
          to="/orders"
          class="rounded-2xl border border-brand-border px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-surface-low"
        >
          Barcha buyurtmalar
        </NuxtLink>
      </div>
    </div>

    <template v-else>
      <div>
        <NuxtLink
          to="/cart"
          class="inline-flex items-center gap-1.5 rounded-full border border-brand-border/60 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-brand-surface-low"
        >
          <Icon
            name="lucide:arrow-left"
            class="h-3.5 w-3.5"
          />
          Savat
        </NuxtLink>
        <p class="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-secondary-700">
          Checkout
        </p>
        <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Buyurtmani yakunlash
        </h1>
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
          Checkout uchun hisob kerak
        </h2>
        <p class="mt-2 text-sm leading-6 text-brand-muted">
          Buyurtmani yakunlash va to'lov ochish uchun hisobga kiring.
        </p>
        <NuxtLink
          :to="loginHref"
          class="mt-6 rounded-2xl bg-secondary-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-secondary-700"
        >
          Hisobga kirish
        </NuxtLink>
      </div>

      <div
        v-else-if="!cart || cart.is_empty"
        class="mt-8 rounded-3xl border border-dashed border-brand-border bg-brand-surface-low/40 p-10 text-center"
      >
        <h2 class="text-xl font-bold text-slate-900">
          Checkout uchun savat bo'sh
        </h2>
        <p class="mt-2 text-sm leading-6 text-brand-muted">
          Avval mahsulot sahifasidan dizaynni savatga yuboring.
        </p>
        <NuxtLink
          to="/cart"
          class="mt-6 inline-flex rounded-2xl bg-secondary-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-secondary-700"
        >
          Savatchaga qaytish
        </NuxtLink>
      </div>

      <div
        v-else
        class="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <form
          class="space-y-8 rounded-3xl border border-brand-border/50 bg-white p-6 shadow-sm"
          @submit.prevent="handleSubmit"
        >
          <p
            v-if="error"
            class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {{ error }}
          </p>

          <section>
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700">
                <Icon
                  name="lucide:user-round"
                  class="h-4 w-4"
                />
              </div>
              <h2 class="text-base font-bold text-slate-900">
                Kontakt ma'lumotlari
              </h2>
            </div>
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="mb-1.5 block text-sm font-medium text-slate-700">Ism va familiya <span class="text-secondary-600">*</span></span>
                <input
                  v-model="form.contact_name"
                  required
                  placeholder="Abdullayev Abdulla"
                  class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
                >
              </label>
              <label class="block">
                <span class="mb-1.5 block text-sm font-medium text-slate-700">Email <span class="text-secondary-600">*</span></span>
                <input
                  v-model="form.contact_email"
                  type="email"
                  required
                  placeholder="example@mail.com"
                  class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
                >
              </label>
              <label class="block sm:col-span-2">
                <span class="mb-1.5 block text-sm font-medium text-slate-700">Telefon <span class="text-secondary-600">*</span></span>
                <input
                  v-model="form.contact_phone"
                  required
                  placeholder="+998 90 123 45 67"
                  class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
                >
              </label>
            </div>
          </section>

          <section>
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700">
                <Icon
                  name="lucide:map-pin"
                  class="h-4 w-4"
                />
              </div>
              <h2 class="text-base font-bold text-slate-900">
                Yetkazib berish
              </h2>
            </div>

            <div class="mt-4 grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                class="rounded-2xl border p-4 text-left transition"
                :class="form.delivery_method === 'DELIVERY' ? 'border-secondary-400 bg-secondary-50 ring-2 ring-secondary-200' : 'border-brand-border/60 bg-white hover:border-secondary-200'"
                @click="form.delivery_method = 'DELIVERY'"
              >
                <p class="text-sm font-semibold text-slate-900">
                  Yetkazib berish
                </p>
                <p class="mt-0.5 text-xs text-brand-muted">
                  Manzilingizga yetkazib beramiz.
                </p>
              </button>
              <button
                type="button"
                class="rounded-2xl border p-4 text-left transition"
                :class="form.delivery_method === 'PICKUP' ? 'border-secondary-400 bg-secondary-50 ring-2 ring-secondary-200' : 'border-brand-border/60 bg-white hover:border-secondary-200'"
                @click="form.delivery_method = 'PICKUP'"
              >
                <p class="text-sm font-semibold text-slate-900">
                  Kelib olib ketish
                </p>
                <p class="mt-0.5 text-xs text-brand-muted">
                  Do'kondan o'zingiz olib ketasiz.
                </p>
              </button>
            </div>

            <div class="mt-4">
              <span class="mb-1.5 block text-sm font-medium text-slate-700">Ishlab chiqarish markazi <span class="text-secondary-600">*</span></span>
              <div
                v-if="centersQuery.isLoading.value"
                class="h-20 animate-pulse rounded-2xl bg-brand-surface-low"
              />
              <p
                v-else-if="centers.length === 0"
                class="rounded-2xl border border-dashed border-brand-border bg-brand-surface-low/40 p-4 text-sm text-brand-muted"
              >
                Hozircha mos ishlab chiqarish markazi mavjud emas.
              </p>
              <div
                v-else
                class="space-y-2.5"
              >
                <button
                  v-for="center in centers"
                  :key="center.id"
                  type="button"
                  class="w-full rounded-2xl border p-4 text-left transition"
                  :class="form.production_center === center.id ? 'border-secondary-400 bg-secondary-50 ring-2 ring-secondary-200' : 'border-brand-border/60 bg-white hover:border-secondary-200'"
                  @click="form.production_center = center.id"
                >
                  <p class="text-sm font-semibold text-slate-900">
                    {{ center.name }}
                  </p>
                  <p class="mt-0.5 text-sm text-brand-muted">
                    {{ center.address }}
                  </p>
                </button>
              </div>
            </div>

            <div
              v-if="form.delivery_method === 'DELIVERY'"
              class="mt-4 grid gap-4 sm:grid-cols-2"
            >
              <label class="block sm:col-span-2">
                <span class="mb-1.5 block text-sm font-medium text-slate-700">Manzil <span class="text-secondary-600">*</span></span>
                <input
                  v-model="form.shipping_address"
                  required
                  class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
                >
              </label>
              <label class="block">
                <span class="mb-1.5 block text-sm font-medium text-slate-700">Shahar</span>
                <input
                  v-model="form.shipping_city"
                  class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
                >
              </label>
              <label class="block">
                <span class="mb-1.5 block text-sm font-medium text-slate-700">Viloyat</span>
                <input
                  v-model="form.shipping_state"
                  class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
                >
              </label>
              <label class="block sm:col-span-2">
                <span class="mb-1.5 block text-sm font-medium text-slate-700">Izoh (ixtiyoriy)</span>
                <textarea
                  v-model="form.customer_notes"
                  class="min-h-24 w-full resize-none rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
                  placeholder="Masalan, qo'ng'iroq qilib yetib kelishdan oldin xabar bering"
                />
              </label>
            </div>
            <label
              v-else
              class="mt-4 block"
            >
              <span class="mb-1.5 block text-sm font-medium text-slate-700">Izoh (ixtiyoriy)</span>
              <textarea
                v-model="form.customer_notes"
                class="min-h-24 w-full resize-none rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
                placeholder="Masalan, qachon olib ketishni rejalashtirganingizni yozing"
              />
            </label>
          </section>

          <section>
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700">
                <Icon
                  name="lucide:credit-card"
                  class="h-4 w-4"
                />
              </div>
              <h2 class="text-base font-bold text-slate-900">
                To'lov usuli
              </h2>
            </div>
            <div class="mt-4 grid gap-2.5">
              <button
                v-for="item in PROVIDERS"
                :key="item.value"
                type="button"
                class="rounded-2xl border p-4 text-left transition"
                :class="provider === item.value ? 'border-secondary-400 bg-secondary-50 ring-2 ring-secondary-200' : 'border-brand-border/60 bg-white hover:border-secondary-200'"
                @click="provider = item.value"
              >
                <p class="text-sm font-semibold text-slate-900">
                  {{ item.title }}
                </p>
                <p class="mt-0.5 text-xs text-brand-muted">
                  {{ item.description }}
                </p>
              </button>
            </div>
          </section>

          <button
            type="submit"
            :disabled="!canSubmit || submitting"
            class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-secondary-600/25 transition hover:bg-secondary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ submitting ? 'Yaratilmoqda...' : 'Buyurtmani yaratish va to\'lovni boshlash' }}
            <Icon
              name="lucide:arrow-right"
              class="h-4 w-4"
            />
          </button>
        </form>

        <aside class="h-fit space-y-4">
          <div class="rounded-2xl bg-gradient-to-br from-secondary-700 to-brand-dim p-6 text-white shadow-xl">
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
              Buyurtma tarkibi
            </p>
            <div class="mt-5 space-y-3">
              <div
                v-for="item in cart.items"
                :key="item.uuid"
                class="rounded-2xl border border-white/15 bg-white/10 p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-white">
                      {{ item.draft_name || item.product_name }}
                    </p>
                    <p class="mt-0.5 text-xs text-white/70">
                      {{ item.product_type_name }} · {{ item.variant_display }}
                    </p>
                  </div>
                  <span class="text-xs text-white/70">×{{ item.quantity }}</span>
                </div>
                <p class="mt-2 text-sm font-semibold text-white/90">
                  {{ formatMoney(item.total_price) }}
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-brand-border/50 bg-white p-6 shadow-sm">
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm text-brand-muted">
                <span>Oraliq summa</span>
                <span>{{ formatMoney(cart.subtotal) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm text-brand-muted">
                <span>{{ form.delivery_method === 'PICKUP' ? "Do'kondan olib ketish" : 'Yetkazib berish' }}</span>
                <span class="text-xs">{{ form.delivery_method === 'PICKUP' ? 'Bepul' : 'Formdan keyin aniqlanadi' }}</span>
              </div>
              <div class="border-t border-brand-border/50 pt-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-slate-700">Jami</span>
                  <span class="text-2xl font-extrabold text-slate-950">{{ formatMoney(cart.total_amount) }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
