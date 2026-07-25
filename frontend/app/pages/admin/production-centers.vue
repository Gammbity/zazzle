<script setup lang="ts">
import type { ProductionCenter, ProductionCenterType } from '~/types/commerce';

definePageMeta({ layout: 'admin' });

interface FormState {
  name: string;
  type: ProductionCenterType;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
  supports_pickup: boolean;
  supports_delivery: boolean;
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  name: '',
  type: 'PARTNER',
  address: '',
  phone: '',
  email: '',
  is_active: true,
  supports_pickup: true,
  supports_delivery: true,
  sort_order: 0,
};

function toFormState(center: ProductionCenter): FormState {
  return {
    name: center.name,
    type: center.type,
    address: center.address,
    phone: center.phone,
    email: center.email,
    is_active: center.is_active,
    supports_pickup: center.supports_pickup,
    supports_delivery: center.supports_delivery,
    sort_order: center.sort_order,
  };
}

const centersQuery = useAdminProductionCenters();
const createMutation = useCreateAdminProductionCenter();
const updateMutation = useUpdateAdminProductionCenter();
const deleteMutation = useDeleteAdminProductionCenter();

const editingId = ref<number | 'new' | null>(null);
const form = reactive<FormState>({ ...EMPTY_FORM });

const centers = computed(() => {
  const data = centersQuery.data.value;
  if (!data) return [];
  return Array.isArray(data) ? data : data.results;
});

const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value);

function startCreate() {
  Object.assign(form, EMPTY_FORM);
  editingId.value = 'new';
}

function startEdit(center: ProductionCenter) {
  Object.assign(form, toFormState(center));
  editingId.value = center.id;
}

function cancelEdit() {
  editingId.value = null;
  Object.assign(form, EMPTY_FORM);
}

function handleSubmit() {
  const payload = { ...form };
  if (editingId.value === 'new') {
    createMutation.mutate(payload, { onSuccess: cancelEdit });
  }
  else if (editingId.value != null) {
    updateMutation.mutate({ id: editingId.value, payload }, { onSuccess: cancelEdit });
  }
}

function handleDelete(center: ProductionCenter) {
  if (!window.confirm(`"${center.name}" o'chirilsinmi?`)) return;
  deleteMutation.mutate(center.id);
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-700">
          Admin
        </p>
        <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Ishlab chiqarish markazlari
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
          Buyurtmalar tayinlanadigan hamkor bosmaxonalar va o'z filiallaringizni boshqaring.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-2xl bg-secondary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-700"
        @click="startCreate"
      >
        <Icon
          name="lucide:plus"
          class="h-4 w-4"
        />
        Yangi markaz
      </button>
    </div>

    <form
      v-if="editingId !== null"
      class="mt-6 rounded-3xl border border-secondary-200 bg-secondary-50/40 p-6"
      @submit.prevent="handleSubmit"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-slate-900">
          {{ editingId === 'new' ? 'Yangi markaz' : 'Markazni tahrirlash' }}
        </h2>
        <button
          type="button"
          class="rounded-full p-1.5 text-brand-muted hover:bg-white"
          @click="cancelEdit"
        >
          <Icon
            name="lucide:x"
            class="h-4 w-4"
          />
        </button>
      </div>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Nomi</span>
          <input
            v-model="form.name"
            required
            class="w-full rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-secondary-400"
          >
        </label>

        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Turi</span>
          <select
            v-model="form.type"
            class="w-full rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-secondary-400"
          >
            <option value="PARTNER">
              Hamkor (Partner)
            </option>
            <option value="OWN">
              O'z filialimiz (Own)
            </option>
          </select>
        </label>

        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Telefon</span>
          <input
            v-model="form.phone"
            placeholder="+998901234567"
            class="w-full rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-secondary-400"
          >
        </label>

        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
          <input
            v-model="form.email"
            type="email"
            class="w-full rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-secondary-400"
          >
        </label>

        <label class="block sm:col-span-2">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Manzil <span class="text-secondary-600">*</span></span>
          <input
            v-model="form.address"
            required
            class="w-full rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-secondary-400"
          >
        </label>

        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Tartib raqami</span>
          <input
            v-model.number="form.sort_order"
            type="number"
            class="w-full rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-secondary-400"
          >
        </label>

        <div class="flex flex-wrap items-center gap-4 pt-6">
          <label class="flex items-center gap-2">
            <input
              v-model="form.is_active"
              type="checkbox"
              class="h-4 w-4 rounded border-brand-border/60 text-secondary-600 focus:ring-secondary-400"
            >
            <span class="text-sm font-medium text-slate-700">Faol</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              v-model="form.supports_pickup"
              type="checkbox"
              class="h-4 w-4 rounded border-brand-border/60 text-secondary-600 focus:ring-secondary-400"
            >
            <span class="text-sm font-medium text-slate-700">Olib ketish</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              v-model="form.supports_delivery"
              type="checkbox"
              class="h-4 w-4 rounded border-brand-border/60 text-secondary-600 focus:ring-secondary-400"
            >
            <span class="text-sm font-medium text-slate-700">Yetkazib berish</span>
          </label>
        </div>
      </div>

      <div class="mt-5 flex items-center gap-3">
        <button
          type="submit"
          :disabled="isSaving || !form.address"
          class="rounded-2xl bg-secondary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-700 disabled:opacity-50"
        >
          {{ isSaving ? 'Saqlanmoqda...' : 'Saqlash' }}
        </button>
        <button
          type="button"
          class="rounded-2xl px-5 py-2.5 text-sm font-semibold text-brand-muted hover:bg-white"
          @click="cancelEdit"
        >
          Bekor qilish
        </button>
      </div>
    </form>

    <div
      v-if="centersQuery.isLoading.value"
      class="mt-8 h-64 animate-pulse rounded-3xl bg-brand-surface-low"
    />
    <div
      v-else-if="centers.length === 0"
      class="mt-8 rounded-3xl border border-dashed border-brand-border bg-brand-surface-low/40 p-10 text-center"
    >
      <p class="text-base text-brand-muted">
        Markaz topilmadi.
      </p>
    </div>
    <div
      v-else
      class="mt-6 grid gap-3"
    >
      <article
        v-for="center in centers"
        :key="center.id"
        class="rounded-2xl border border-brand-border/50 bg-white p-5 shadow-sm transition hover:border-secondary-200"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-700">
              <Icon
                name="lucide:factory"
                class="h-4 w-4"
              />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2.5">
                <h2 class="text-lg font-bold text-slate-950">
                  {{ center.name }}
                </h2>
                <span class="rounded-full border border-brand-border/60 bg-brand-surface-low px-3 py-1 text-xs font-semibold text-slate-600">
                  {{ center.type === 'OWN' ? "O'z filial" : 'Hamkor' }}
                </span>
                <span
                  class="rounded-full border px-3 py-1 text-xs font-semibold"
                  :class="center.is_active ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-slate-200 bg-slate-100 text-slate-600'"
                >
                  {{ center.is_active ? 'Faol' : 'Faol emas' }}
                </span>
                <span
                  v-if="center.supports_pickup"
                  class="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                >
                  Olib ketish
                </span>
                <span
                  v-if="center.supports_delivery"
                  class="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700"
                >
                  Yetkazib berish
                </span>
              </div>
              <p class="mt-1 text-sm text-brand-muted">
                {{ center.address }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-secondary-200 hover:text-secondary-700"
              @click="startEdit(center)"
            >
              <Icon
                name="lucide:pencil"
                class="h-3.5 w-3.5"
              />
              Tahrirlash
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              @click="handleDelete(center)"
            >
              <Icon
                name="lucide:trash-2"
                class="h-3.5 w-3.5"
              />
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
