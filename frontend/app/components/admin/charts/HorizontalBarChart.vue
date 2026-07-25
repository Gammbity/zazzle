<script setup lang="ts">
interface BarDatum {
  label: string;
  value: number;
  valueLabel?: string;
}

const props = withDefaults(defineProps<{
  data: BarDatum[];
  emptyMessage?: string;
}>(), {
  emptyMessage: 'Ma\'lumot yo\'q',
});

const hoverIndex = ref<number | null>(null);
const maxValue = computed(() => Math.max(...props.data.map(item => item.value), 1));

function formatValue(value: number) {
  return value.toLocaleString('uz-UZ');
}

function widthPct(value: number) {
  return value > 0 ? Math.max((value / maxValue.value) * 100, 3) : 0;
}
</script>

<template>
  <div
    v-if="data.length === 0"
    class="flex h-32 items-center justify-center text-sm text-brand-muted/70"
  >
    {{ emptyMessage }}
  </div>
  <div
    v-else
    class="space-y-3"
  >
    <div
      v-for="(item, index) in data"
      :key="item.label"
      @pointerenter="hoverIndex = index"
      @pointerleave="hoverIndex = null"
    >
      <div class="mb-1 flex items-center justify-between gap-3 text-xs">
        <span class="truncate text-slate-600">{{ item.label }}</span>
        <span
          class="shrink-0 font-semibold tabular-nums transition-colors"
          :class="hoverIndex === index ? 'text-secondary-700' : 'text-slate-900'"
        >
          {{ item.valueLabel ?? formatValue(item.value) }}
        </span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded bg-brand-surface-low">
        <div
          class="h-full rounded-r transition-colors"
          :class="hoverIndex === index ? 'bg-secondary-700' : 'bg-secondary-600'"
          :style="{ width: `${widthPct(item.value)}%` }"
        />
      </div>
    </div>
  </div>
</template>
