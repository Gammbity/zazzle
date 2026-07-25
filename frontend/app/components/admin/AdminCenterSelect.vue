<script setup lang="ts">
const props = defineProps<{ modelValue: number | null }>();
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>();

const centersQuery = useAdminProductionCenters();
const centers = computed(() => {
  const data = centersQuery.data.value;
  if (!data) return [];
  return Array.isArray(data) ? data : data.results;
});

function handleChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  emit('update:modelValue', value ? Number(value) : null);
}
</script>

<template>
  <select
    :value="props.modelValue ?? ''"
    class="rounded-xl border border-brand-border/60 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-secondary-400"
    @change="handleChange"
  >
    <option value="">
      Markaz tanlang...
    </option>
    <option
      v-for="center in centers"
      :key="center.id"
      :value="center.id"
    >
      {{ center.name }}
    </option>
  </select>
</template>
