<script setup lang="ts">
const props = defineProps<{ productId: number }>();

const EMPTY_FORM = {
  size: '',
  color: '',
  color_hex: '#000000',
  sale_price: '',
  production_cost: '',
  stock_quantity: 0,
};

const form = reactive({ ...EMPTY_FORM });
const createMutation = useCreateAdminVariant();

function handleCreate() {
  if (!form.sale_price) return;
  createMutation.mutate({ productId: props.productId, payload: { ...form } }, {
    onSuccess: () => Object.assign(form, EMPTY_FORM),
  });
}
</script>

<template>
  <tr>
    <td class="py-2 pr-2">
      <input
        v-model="form.size"
        placeholder="S/M/L"
        class="w-full rounded-xl border border-brand-border/60 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary-400"
      >
    </td>
    <td class="py-2 pr-2">
      <input
        v-model="form.color"
        placeholder="Rang"
        class="w-full rounded-xl border border-brand-border/60 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary-400"
      >
    </td>
    <td class="py-2 pr-2">
      <input
        v-model="form.color_hex"
        class="w-full rounded-xl border border-brand-border/60 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary-400"
      >
    </td>
    <td class="py-2 pr-2">
      <input
        v-model="form.sale_price"
        placeholder="Narx"
        class="w-full rounded-xl border border-brand-border/60 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary-400"
      >
    </td>
    <td class="py-2 pr-2">
      <input
        v-model="form.production_cost"
        placeholder="Tannarx"
        class="w-full rounded-xl border border-brand-border/60 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary-400"
      >
    </td>
    <td class="py-2 pr-2">
      <input
        v-model.number="form.stock_quantity"
        type="number"
        class="w-full rounded-xl border border-brand-border/60 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary-400"
      >
    </td>
    <td />
    <td class="py-2 pl-2">
      <button
        type="button"
        :disabled="createMutation.isPending.value || !form.sale_price"
        title="Qo'shish"
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-600 text-white transition hover:bg-secondary-700 disabled:opacity-60"
        @click="handleCreate"
      >
        <Icon
          name="lucide:plus"
          class="h-3.5 w-3.5"
        />
      </button>
    </td>
  </tr>
</template>
