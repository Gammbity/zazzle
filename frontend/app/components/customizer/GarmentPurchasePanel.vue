<script setup lang="ts">
import type { fabric } from 'fabric';
import { GARMENT_COLORS } from '~/lib/garment-presets';
import { toBackendSlug } from '~/lib/product-slugs';
import type { ProductListItem, ProductListResponse } from '~/types/commerce';

const props = defineProps<{
  canvas: fabric.Canvas | null;
  canvasVersion: number;
  productLabel: string;
  shirtColor: string;
  productSlug: string;
}>();
const emit = defineEmits<{ 'update:shirtColor': [hex: string]; 'clear-design': [] }>();

// Custom colors picked via the "+" swatch join the palette as their own
// circle so they can be reselected later without reopening the picker.
const customColors = ref<string[]>([]);
function commitCustomColor(hex: string) {
  const known = [...GARMENT_COLORS.map(c => c.value), ...customColors.value];
  if (!known.some(v => v.toLowerCase() === hex.toLowerCase())) customColors.value.push(hex);
}

// ── Quantity + price ────────────────────────────────────────────────────
// No slug-based detail route on the backend (only `/products/<id>/`), so
// the list is fetched once and filtered client-side by slug.
const quantity = ref(1);
const api = useApi();
const product = ref<ProductListItem | null>(null);
const loading = ref(true);
const fetchFailed = ref(false);

async function loadProduct() {
  loading.value = true;
  fetchFailed.value = false;
  try {
    const backendSlug = toBackendSlug(props.productSlug);
    const response = await api.get<ProductListResponse>('/products/', { page_size: 100 });
    product.value = response.results.find(p => p.slug === backendSlug) ?? null;
    if (!product.value) fetchFailed.value = true;
  }
  catch {
    product.value = null;
    fetchFailed.value = true;
  }
  finally {
    loading.value = false;
  }
}
onMounted(loadProduct);

const unitPrice = computed(() => product.value?.price_range.min_price ?? 0);
const totalPrice = computed(() => unitPrice.value * quantity.value);

const submitting = ref(false);
const errorMsg = ref<string | null>(null);

async function handleOrder() {
  if (!props.canvas || props.canvas.getObjects().length === 0) {
    errorMsg.value = 'Avval rasm, matn yoki stiker qo\'shing.';
    return;
  }
  if (!isAuthenticated()) {
    await navigateTo('/cart');
    return;
  }
  submitting.value = true;
  errorMsg.value = null;
  try {
    // Draft creation / add-to-cart wiring lands with the checkout flow —
    // for now this validates the design and routes to cart.
    await navigateTo('/cart');
  }
  finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-t border-brand-border/50 bg-white p-4 md:w-[320px] md:border-l md:border-t-0">
    <div>
      <p class="mb-2.5 text-sm font-semibold text-slate-900">
        Mahsulot rangi
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="color in GARMENT_COLORS"
          :key="color.value"
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full border border-brand-border/60"
          :style="{ backgroundColor: color.value }"
          :title="color.name"
          :aria-pressed="shirtColor === color.value"
          @click="emit('update:shirtColor', color.value)"
        >
          <Icon
            v-if="shirtColor === color.value"
            name="lucide:check"
            class="h-3.5 w-3.5"
            :style="{ color: color.value === '#ffffff' ? '#8d4b00' : '#ffffff' }"
          />
        </button>
        <button
          v-for="color in customColors"
          :key="color"
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full border border-brand-border/60"
          :style="{ backgroundColor: color }"
          :title="color"
          :aria-pressed="shirtColor.toLowerCase() === color.toLowerCase()"
          @click="emit('update:shirtColor', color)"
        >
          <Icon
            v-if="shirtColor.toLowerCase() === color.toLowerCase()"
            name="lucide:check"
            class="h-3.5 w-3.5"
            :style="{ color: color.toLowerCase() === '#ffffff' ? '#8d4b00' : '#ffffff' }"
          />
        </button>
        <label
          class="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-brand-border text-brand-muted"
          title="Boshqa rang tanlash"
        >
          <Icon
            name="lucide:plus"
            class="h-3.5 w-3.5"
          />
          <input
            type="color"
            :value="shirtColor"
            class="absolute inset-0 cursor-pointer opacity-0"
            :aria-label="`${productLabel} uchun rangni tanlash`"
            @input="emit('update:shirtColor', ($event.target as HTMLInputElement).value)"
            @change="commitCustomColor(($event.target as HTMLInputElement).value)"
          >
        </label>
      </div>
    </div>

    <div class="border-t border-brand-border/50 pt-4">
      <p class="mb-2.5 text-sm font-semibold text-slate-900">
        Miqdor
      </p>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border/60 text-slate-700 transition hover:bg-brand-surface-low"
          @click="quantity = Math.max(1, quantity - 1)"
        >
          <Icon
            name="lucide:minus"
            class="h-4 w-4"
          />
        </button>
        <span class="w-6 text-center text-base font-bold text-slate-900">{{ quantity }}</span>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border/60 text-slate-700 transition hover:bg-brand-surface-low"
          @click="quantity = Math.min(500, quantity + 1)"
        >
          <Icon
            name="lucide:plus"
            class="h-4 w-4"
          />
        </button>
      </div>
    </div>

    <div class="border-t border-brand-border/50 pt-4">
      <p class="mb-2.5 text-sm font-semibold text-slate-900">
        Narx
      </p>
      <p
        v-if="loading"
        class="text-sm text-brand-muted"
      >
        Yuklanmoqda…
      </p>
      <div
        v-else-if="fetchFailed || !product"
        class="flex items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-secondary-700"
      >
        <span class="flex items-center gap-1.5"><Icon
          name="lucide:alert-circle"
          class="h-4 w-4"
        /> Mahsulot narxi yuklanmadi.</span>
        <button
          type="button"
          class="flex items-center gap-1 font-semibold underline"
          @click="loadProduct"
        >
          <Icon
            name="lucide:rotate-ccw"
            class="h-3.5 w-3.5"
          /> Qayta urinish
        </button>
      </div>
      <div
        v-else
        class="space-y-1.5"
      >
        <div class="flex items-center justify-between text-sm text-brand-muted">
          <span>Bir dona narxi</span>
          <span>{{ formatMoney(unitPrice) }}</span>
        </div>
        <div class="flex items-center justify-between text-base font-bold text-slate-900">
          <span>Jami narx</span>
          <span>{{ formatMoney(totalPrice) }}</span>
        </div>
      </div>
    </div>

    <p
      v-if="errorMsg"
      class="flex items-center gap-1.5 text-sm text-rose-600"
    >
      <Icon
        name="lucide:alert-circle"
        class="h-4 w-4"
      /> {{ errorMsg }}
    </p>

    <button
      type="button"
      class="flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary-600 text-sm font-bold text-white shadow-lg shadow-secondary-600/25 transition hover:bg-secondary-700 disabled:opacity-60"
      :disabled="submitting || !product"
      @click="handleOrder"
    >
      {{ submitting ? "Qo'shilmoqda..." : 'Buyurtmani davom ettirish' }}
      <Icon
        name="lucide:arrow-right"
        class="h-4 w-4"
      />
    </button>
    <button
      type="button"
      class="flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
      @click="emit('clear-design')"
    >
      <Icon
        name="lucide:trash-2"
        class="h-4 w-4"
      /> Dizaynni tozalash
    </button>
  </div>
</template>
