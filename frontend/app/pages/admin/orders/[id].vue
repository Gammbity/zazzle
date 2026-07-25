<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi';
import { getOrderStatusMeta } from '~/lib/orderStatus';

definePageMeta({ layout: 'admin' });

function getNextProductionStep(status: string, deliveryMethod: string): { status: string; label: string } | null {
  switch (status) {
    case 'PAID':
      return { status: 'READY_FOR_PRODUCTION', label: 'Ishlab chiqarishga tayyor deb belgilash' };
    case 'READY_FOR_PRODUCTION':
      return { status: 'IN_PRODUCTION', label: 'Ishlab chiqarishni boshlash' };
    case 'IN_PRODUCTION':
      return { status: 'QUALITY_CHECK', label: 'Sifat nazoratiga yuborish' };
    case 'QUALITY_CHECK':
      return deliveryMethod === 'PICKUP'
        ? { status: 'READY_FOR_PICKUP', label: 'Olib ketishga tayyor deb belgilash' }
        : { status: 'READY_FOR_DELIVERY', label: 'Yetkazishga tayyor deb belgilash' };
    case 'READY_FOR_PICKUP':
    case 'READY_FOR_DELIVERY':
      return { status: 'COMPLETED', label: 'Yakunlangan deb belgilash' };
    default:
      return null;
  }
}

const route = useRoute();
const orderId = computed(() => Number(route.params.id));

const orderQuery = useAdminOrder(orderId.value);
const order = computed(() => orderQuery.data.value ?? null);

const updateOrderMutation = useUpdateAdminOrder();
const productionMutation = useUpdateOrderProductionStatus();
const centerId = computed(() => order.value?.production_center?.id);
const employeesQuery = useCenterEmployees(centerId);
const assignMutation = useAssignOrder();

const notesForm = reactive({ admin_notes: '', tracking_number: '', carrier: '' });
const notesSaved = ref(false);
const error = ref<string | null>(null);
const selectedManager = ref<number | ''>('');

watch(order, (newOrder) => {
  if (!newOrder) return;
  notesForm.admin_notes = newOrder.admin_notes ?? '';
  notesForm.tracking_number = newOrder.tracking_number ?? '';
  notesForm.carrier = newOrder.carrier ?? '';
}, { immediate: true });

const statusMeta = computed(() => getOrderStatusMeta(order.value?.status ?? 'NEW'));
const nextStep = computed(() => (order.value ? getNextProductionStep(order.value.status, order.value.delivery_method) : null));
const isPickup = computed(() => order.value?.delivery_method === 'PICKUP');
const lat = computed(() => (order.value?.latitude != null ? Number(order.value.latitude) : null));
const lng = computed(() => (order.value?.longitude != null ? Number(order.value.longitude) : null));

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ');
}

async function handleSaveNotes() {
  if (!order.value) return;
  error.value = null;
  try {
    await updateOrderMutation.mutateAsync({ id: order.value.id, payload: { ...notesForm } });
    notesSaved.value = true;
    setTimeout(() => {
      notesSaved.value = false;
    }, 2000);
  }
  catch (err) {
    error.value = getApiErrorMessage(err, 'Saqlab bo\'lmadi.');
  }
}

async function handleAdvanceProduction() {
  if (!order.value || !nextStep.value) return;
  error.value = null;
  try {
    await productionMutation.mutateAsync({ orderId: order.value.id, status: nextStep.value.status });
  }
  catch (err) {
    error.value = getApiErrorMessage(err, 'Holatni o\'zgartirib bo\'lmadi.');
  }
}

async function handleAssign() {
  if (!order.value || !selectedManager.value) return;
  error.value = null;
  try {
    await assignMutation.mutateAsync({ orderId: order.value.id, managerId: selectedManager.value });
  }
  catch (err) {
    error.value = getApiErrorMessage(err, 'Menejer tayinlab bo\'lmadi.');
  }
}
</script>

<template>
  <div>
    <NuxtLink
      to="/admin/orders"
      class="inline-flex items-center gap-2 rounded-full border border-brand-border/60 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-surface-low"
    >
      <Icon
        name="lucide:arrow-left"
        class="h-4 w-4"
      />
      Buyurtmalar
    </NuxtLink>

    <div
      v-if="orderQuery.isLoading.value"
      class="mt-8 h-96 animate-pulse rounded-3xl bg-brand-surface-low"
    />

    <div
      v-else-if="!order"
      class="mt-8 rounded-3xl border border-dashed border-brand-border bg-brand-surface-low/40 p-10 text-center"
    >
      <h1 class="text-xl font-bold text-slate-900">
        Buyurtma topilmadi
      </h1>
    </div>

    <template v-else>
      <div class="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-700">
            Buyurtma
          </p>
          <h1 class="mt-2 text-3xl font-extrabold text-slate-950">
            {{ order.order_number }}
          </h1>
          <p class="mt-2 text-sm text-brand-muted">
            {{ formatDate(order.created_at) }}
          </p>
        </div>
        <span
          class="rounded-full border px-4 py-2 text-sm font-semibold"
          :class="statusMeta.className"
        >
          {{ statusMeta.label }}
        </span>
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
              Mijoz
            </h2>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl bg-brand-surface-low p-4">
                <p class="text-xs text-brand-muted">
                  Ism
                </p>
                <p class="mt-1.5 font-semibold text-slate-900">
                  {{ order.customer.full_name }}
                </p>
                <p class="mt-0.5 text-sm text-brand-muted">
                  {{ order.customer.email }}
                </p>
                <p class="mt-0.5 text-sm text-brand-muted">
                  {{ order.customer.phone_number || order.shipping_phone || 'Telefon kiritilmagan' }}
                </p>
              </div>
              <div class="rounded-2xl bg-brand-surface-low p-4">
                <p class="text-xs text-brand-muted">
                  Buyurtma izohi
                </p>
                <p class="mt-1.5 text-sm text-slate-700">
                  {{ order.customer_notes || 'Izoh yo\'q' }}
                </p>
              </div>
            </div>
          </section>

          <section class="rounded-3xl border border-brand-border/50 bg-white p-6 shadow-sm">
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700">
                <Icon
                  :name="isPickup ? 'lucide:store' : 'lucide:map-pin'"
                  class="h-4 w-4"
                />
              </div>
              <h2 class="text-lg font-bold text-slate-900">
                {{ isPickup ? 'Kelib olib ketish' : 'Yetkazib berish' }}
              </h2>
            </div>

            <p
              v-if="order.production_center"
              class="mt-3 text-sm text-brand-muted"
            >
              Ishlab chiqarish markazi: <span class="font-semibold text-slate-900">{{ order.production_center.name }}</span>
            </p>

            <p
              v-if="isPickup"
              class="mt-4 text-sm text-brand-muted"
            >
              Mijoz do'kondan o'zi olib ketadi, yetkazib berish talab qilinmaydi.
            </p>
            <div
              v-else
              class="mt-4 space-y-3"
            >
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
              </div>
              <a
                v-if="lat != null && lng != null"
                :href="`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`"
                target="_blank"
                rel="noreferrer"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-700 hover:underline"
              >
                <Icon
                  name="lucide:map-pin"
                  class="h-3.5 w-3.5"
                />
                Xaritada ko'rish ({{ lat.toFixed(5) }}, {{ lng.toFixed(5) }})
              </a>
            </div>
          </section>

          <section class="rounded-3xl border border-brand-border/50 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900">
              Mahsulotlar
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
                    <div class="mt-2 flex flex-wrap gap-3 text-xs text-brand-muted">
                      <span>Variant: {{ [item.size, item.color].filter(Boolean).join(' · ') || 'Standart' }}</span>
                      <span>Soni: {{ item.quantity }}</span>
                    </div>
                  </div>
                  <p class="text-lg font-bold text-slate-900">
                    {{ formatMoney(item.total_price) }}
                  </p>
                </div>
              </article>
            </div>
          </section>

          <section class="rounded-3xl border border-brand-border/50 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900">
              Admin izohlari
            </h2>
            <div class="mt-4 space-y-3">
              <textarea
                v-model="notesForm.admin_notes"
                class="min-h-20 w-full resize-none rounded-2xl border border-brand-border/60 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-secondary-400"
                placeholder="Ichki izoh..."
              />
              <div class="grid gap-3 sm:grid-cols-2">
                <input
                  v-model="notesForm.tracking_number"
                  class="rounded-2xl border border-brand-border/60 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-secondary-400"
                  placeholder="Tracking raqami"
                >
                <input
                  v-model="notesForm.carrier"
                  class="rounded-2xl border border-brand-border/60 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-secondary-400"
                  placeholder="Yetkazib beruvchi"
                >
              </div>
              <button
                type="button"
                :disabled="updateOrderMutation.isPending.value"
                class="inline-flex items-center gap-2 rounded-2xl bg-secondary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-700 disabled:opacity-60"
                @click="handleSaveNotes"
              >
                <Icon
                  name="lucide:save"
                  class="h-4 w-4"
                />
                {{ notesSaved ? 'Saqlandi' : updateOrderMutation.isPending.value ? 'Saqlanmoqda...' : 'Saqlash' }}
              </button>
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
                <span>{{ formatMoney(order.shipping_cost) }}</span>
              </div>
              <div class="border-t border-white/15 pt-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-white/70">Jami</span>
                  <span class="text-2xl font-extrabold">{{ formatMoney(order.total_amount) }}</span>
                </div>
              </div>
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
                Ishlab chiqarish
              </h2>
            </div>
            <div class="mt-4">
              <button
                v-if="nextStep"
                type="button"
                :disabled="productionMutation.isPending.value"
                class="w-full rounded-2xl bg-secondary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary-700 disabled:opacity-60"
                @click="handleAdvanceProduction"
              >
                {{ productionMutation.isPending.value ? 'Yangilanmoqda...' : nextStep.label }}
              </button>
              <p
                v-else
                class="text-sm text-brand-muted"
              >
                Hozirgi holatda ishlab chiqarish harakati mavjud emas.
              </p>
            </div>
          </section>

          <section
            v-if="employeesQuery.data.value && employeesQuery.data.value.length > 0"
            class="rounded-2xl border border-brand-border/50 bg-white p-6 shadow-sm"
          >
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700">
                <Icon
                  name="lucide:user-cog"
                  class="h-4 w-4"
                />
              </div>
              <h2 class="text-base font-bold text-slate-900">
                Menejerga tayinlash
              </h2>
            </div>
            <div class="mt-4 flex gap-2">
              <select
                v-model="selectedManager"
                class="w-full rounded-2xl border border-brand-border/60 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-secondary-400"
              >
                <option value="">
                  Menejerni tanlang
                </option>
                <option
                  v-for="employee in employeesQuery.data.value"
                  :key="employee.id"
                  :value="employee.id"
                >
                  {{ employee.full_name || employee.email }}
                </option>
              </select>
              <button
                type="button"
                :disabled="!selectedManager || assignMutation.isPending.value"
                class="shrink-0 rounded-2xl bg-secondary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-700 disabled:opacity-60"
                @click="handleAssign"
              >
                Tayinlash
              </button>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
