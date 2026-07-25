<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi';
import { getRouteSlugForCategory } from '~/lib/product-slugs';

const route = useRoute();
const loginHref = computed(() => `/login?redirect=${encodeURIComponent(route.fullPath)}`);
const authState = useAuthState();
const cartQuery = useCart();
const updateMutation = useUpdateCartItem();
const removeMutation = useRemoveCartItem();
const clearMutation = useClearCart();

const busyItem = ref<string | null>(null);
const actionError = ref<string | null>(null);

const cart = computed(() => cartQuery.data.value ?? null);
const error = computed(() => actionError.value
  ?? (cartQuery.isError.value ? getApiErrorMessage(cartQuery.error.value, 'Savatchani yuklashda xatolik yuz berdi.') : null));

async function handleQuantityChange(itemUuid: string, quantity: number) {
  busyItem.value = itemUuid;
  actionError.value = null;
  try {
    await updateMutation.mutateAsync({ itemUuid, quantity });
  }
  catch {
    actionError.value = 'Savat elementini yangilab bo\'lmadi.';
  }
  finally {
    busyItem.value = null;
  }
}

async function handleRemove(itemUuid: string) {
  busyItem.value = itemUuid;
  actionError.value = null;
  try {
    await removeMutation.mutateAsync(itemUuid);
  }
  catch {
    actionError.value = 'Elementni savatdan olib tashlab bo\'lmadi.';
  }
  finally {
    busyItem.value = null;
  }
}

async function handleClear() {
  busyItem.value = 'clear';
  actionError.value = null;
  try {
    await clearMutation.mutateAsync();
  }
  catch {
    actionError.value = 'Savatchani tozalab bo\'lmadi.';
  }
  finally {
    busyItem.value = null;
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
      Savatchangiz
    </h1>

    <div
      v-if="cartQuery.isLoading.value"
      class="mt-8 h-64 animate-pulse rounded-3xl bg-brand-surface-low"
    />

    <div
      v-else-if="!authState"
      class="mt-8 rounded-3xl border border-brand-border/50 bg-white p-8 text-center shadow-sm sm:p-10"
    >
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary-50 text-secondary-700">
        <Icon
          name="lucide:shopping-bag"
          class="size-12"
        />
      </div>
      <h2 class="mt-5 text-xl font-bold text-slate-900">
        Avval hisobingizga kiring yoki ro'yxatdan o'ting
      </h2>
      <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <NuxtLink
          :to="loginHref"
          class="rounded-2xl bg-secondary-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-secondary-700"
        >
          Hisobga kirish
        </NuxtLink>
        <NuxtLink
          to="/"
          class="rounded-2xl border border-brand-border px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-surface-low"
        >
          Mahsulotlarni ko'rish
        </NuxtLink>
      </div>
    </div>

    <div
      v-else-if="!cart || cart.is_empty"
      class="mt-8 rounded-3xl border border-dashed border-brand-border bg-brand-surface-low/40 p-10 text-center"
    >
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary-50 text-secondary-700">
        <Icon
          name="lucide:package-2"
          class="h-7 w-7"
        />
      </div>
      <h2 class="mt-5 text-xl font-bold text-slate-900">
        Savatcha hozircha bo'sh
      </h2>
      <p class="mt-2 text-sm leading-6 text-brand-muted">
        Mahsulot sahifasida dizaynni tayyorlab, variantni tanlang va savatchaga yuboring.
      </p>
      <NuxtLink
        to="/"
        class="mt-6 inline-flex items-center gap-2 rounded-2xl bg-secondary-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-secondary-700"
      >
        Mahsulotlarga qaytish
        <Icon
          name="lucide:arrow-right"
          class="h-4 w-4"
        />
      </NuxtLink>
    </div>

    <div
      v-else
      class="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
    >
      <div class="space-y-4">
        <p
          v-if="error"
          class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {{ error }}
        </p>

        <article
          v-for="item in cart.items"
          :key="item.uuid"
          class="rounded-2xl border border-brand-border/50 bg-white p-5 shadow-sm"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-700">
                {{ item.product_type_name }}
              </p>
              <h2 class="mt-1.5 text-lg font-bold text-slate-900">
                {{ item.draft_name || item.product_name }}
              </h2>
              <p class="mt-1 text-sm text-brand-muted">
                Variant: {{ item.variant_display }}
              </p>
              <NuxtLink
                v-if="getRouteSlugForCategory(item.product_category)"
                :to="`/products/${getRouteSlugForCategory(item.product_category)}`"
                class="mt-2 inline-flex text-sm font-semibold text-secondary-700 hover:text-secondary-800"
              >
                Mahsulot sahifasini ochish
              </NuxtLink>
            </div>

            <div class="rounded-2xl bg-brand-surface-low px-4 py-3 text-right">
              <p class="text-xs text-brand-muted">
                Jami
              </p>
              <p class="mt-1 text-lg font-bold text-slate-900">
                {{ formatMoney(item.total_price) }}
              </p>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-brand-border/50 pt-4">
            <div class="flex items-center gap-3">
              <button
                type="button"
                :disabled="busyItem === item.uuid"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border/60 text-lg font-semibold text-slate-700 transition hover:bg-brand-surface-low disabled:opacity-50"
                @click="handleQuantityChange(item.uuid, Math.max(1, item.quantity - 1))"
              >
                −
              </button>
              <div class="min-w-14 rounded-full bg-brand-surface-low px-4 py-1.5 text-center text-sm font-semibold text-slate-900">
                {{ item.quantity }}
              </div>
              <button
                type="button"
                :disabled="busyItem === item.uuid"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border/60 text-lg font-semibold text-slate-700 transition hover:bg-brand-surface-low disabled:opacity-50"
                @click="handleQuantityChange(item.uuid, item.quantity + 1)"
              >
                +
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <div class="text-sm text-brand-muted">
                Bir dona: {{ formatMoney(item.unit_price) }}
              </div>
              <button
                type="button"
                :disabled="busyItem === item.uuid"
                class="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                @click="handleRemove(item.uuid)"
              >
                <Icon
                  name="lucide:trash-2"
                  class="h-3.5 w-3.5"
                />
                Olib tashlash
              </button>
            </div>
          </div>
        </article>
      </div>

      <aside class="h-fit rounded-2xl bg-gradient-to-br from-secondary-700 to-brand-dim p-6 text-white shadow-xl">
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
          Xulosa
        </p>
        <div class="mt-5 space-y-3 rounded-2xl border border-white/15 bg-white/10 p-5">
          <div class="flex items-center justify-between text-sm text-white/85">
            <span>Mahsulotlar soni</span>
            <span>{{ cart.total_items }}</span>
          </div>
          <div class="flex items-center justify-between text-sm text-white/85">
            <span>Oraliq summa</span>
            <span>{{ formatMoney(cart.subtotal) }}</span>
          </div>
          <div class="flex items-center justify-between text-sm text-white/85">
            <span>Yetkazib berish</span>
            <span class="text-right text-xs">
              {{ Number.parseFloat(cart.shipping_cost) > 0 ? formatMoney(cart.shipping_cost) : 'Checkoutda aniqlanadi' }}
            </span>
          </div>
          <div class="border-t border-white/15 pt-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-white/70">Jami</span>
              <span class="text-2xl font-extrabold">{{ formatMoney(cart.total_amount) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 flex flex-col gap-3">
          <NuxtLink
            to="/checkout"
            class="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-secondary-800 shadow-sm transition hover:bg-secondary-50"
          >
            Checkoutga o'tish
            <Icon
              name="lucide:arrow-right"
              class="h-4 w-4"
            />
          </NuxtLink>
          <button
            type="button"
            :disabled="busyItem === 'clear'"
            class="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            @click="handleClear"
          >
            Savatchani tozalash
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
