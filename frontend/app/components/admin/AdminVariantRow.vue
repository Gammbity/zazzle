<script setup lang="ts">
import type { CommerceVariant } from '~/types/commerce';

const props = defineProps<{
  productId: number;
  variant: CommerceVariant;
}>();

const form = reactive({
  size: props.variant.size,
  color: props.variant.color,
  color_hex: props.variant.color_hex,
  sale_price: props.variant.sale_price,
  production_cost: props.variant.production_cost ?? '',
  stock_quantity: props.variant.stock_quantity ?? 0,
  is_active: props.variant.is_active,
});

const updateMutation = useUpdateAdminVariant();
const deleteMutation = useDeleteAdminVariant();

function handleSave() {
  updateMutation.mutate({ productId: props.productId, variantId: props.variant.id, payload: { ...form } });
}

function handleDelete() {
  if (!window.confirm(`${props.variant.variant_name} variantini o'chirasizmi?`)) return;
  deleteMutation.mutate({ productId: props.productId, variantId: props.variant.id });
}
</script>

<template>
  <tr class="border-b border-brand-border/40 last:border-0">
    <td class="py-2 pr-2">
      <input
        v-model="form.size"
        class="w-full rounded-xl border border-brand-border/60 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary-400"
      >
    </td>
    <td class="py-2 pr-2">
      <input
        v-model="form.color"
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
        class="w-full rounded-xl border border-brand-border/60 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary-400"
      >
    </td>
    <td class="py-2 pr-2">
      <input
        v-model="form.production_cost"
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
    <td class="py-2 pr-2 text-center">
      <input
        v-model="form.is_active"
        type="checkbox"
      >
    </td>
    <td class="py-2 pl-2">
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          :disabled="updateMutation.isPending.value"
          title="Saqlash"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-50 text-secondary-700 transition hover:bg-secondary-100 disabled:opacity-60"
          @click="handleSave"
        >
          <Icon
            name="lucide:save"
            class="h-3.5 w-3.5"
          />
        </button>
        <button
          type="button"
          :disabled="deleteMutation.isPending.value"
          title="O'chirish"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
          @click="handleDelete"
        >
          <Icon
            name="lucide:trash-2"
            class="h-3.5 w-3.5"
          />
        </button>
      </div>
    </td>
  </tr>
</template>
