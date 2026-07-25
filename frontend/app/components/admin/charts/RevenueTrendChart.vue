<script setup lang="ts">
interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

const props = defineProps<{ data: RevenuePoint[] }>();

const WIDTH = 600;
const HEIGHT = 220;
const PADDING_LEFT = 44;
const PADDING_RIGHT = 12;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 28;
const PLOT_WIDTH = WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
const GRID_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];

const hoverIndex = ref<number | null>(null);

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1000)}K`;
  return `${Math.round(value)}`;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
}

const maxRevenue = computed(() => niceMax(Math.max(...props.data.map(point => point.revenue), 0)));

const points = computed(() => {
  if (props.data.length === 0) return [];
  const stepX = props.data.length > 1 ? PLOT_WIDTH / (props.data.length - 1) : 0;
  return props.data.map((point, index) => ({
    ...point,
    x: PADDING_LEFT + stepX * index,
    y: PADDING_TOP + PLOT_HEIGHT - (maxRevenue.value > 0 ? (point.revenue / maxRevenue.value) * PLOT_HEIGHT : 0),
  }));
});

const linePath = computed(() => points.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' '));

const baselineY = PADDING_TOP + PLOT_HEIGHT;

const areaPath = computed(() => {
  if (points.value.length === 0) return '';
  const first = points.value[0]!;
  const lastPoint = points.value[points.value.length - 1]!;
  return `${linePath.value} L ${lastPoint.x.toFixed(2)} ${baselineY.toFixed(2)} L ${first.x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
});

const last = computed(() => points.value[points.value.length - 1] ?? null);
const hovered = computed(() => (hoverIndex.value !== null ? points.value[hoverIndex.value] : null) ?? null);

const xLabelIndexes = computed(() => Array.from(new Set([0, Math.floor((points.value.length - 1) / 2), points.value.length - 1])));

function labelAnchor(index: number) {
  if (index === 0) return 'start';
  if (index === points.value.length - 1) return 'end';
  return 'middle';
}

function handlePointerMove(event: PointerEvent) {
  if (points.value.length === 0) return;
  const target = event.currentTarget as SVGSVGElement;
  const rect = target.getBoundingClientRect();
  const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH;
  let closestIndex = 0;
  let closestDistance = Infinity;
  points.value.forEach((point, index) => {
    const distance = Math.abs(point.x - relativeX);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });
  hoverIndex.value = closestIndex;
}
</script>

<template>
  <div
    v-if="data.length === 0"
    class="flex h-48 items-center justify-center text-sm text-brand-muted/70"
  >
    Ma'lumot yo'q
  </div>
  <div
    v-else
    class="relative"
  >
    <svg
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      class="w-full text-secondary-600"
      role="img"
      :aria-label="`Kunlik tushum trendi, oxirgi qiymat ${last ? formatMoney(last.revenue) : ''}`"
      @pointermove="handlePointerMove"
      @pointerleave="hoverIndex = null"
    >
      <g
        v-for="fraction in GRID_FRACTIONS"
        :key="fraction"
      >
        <line
          :x1="PADDING_LEFT"
          :x2="WIDTH - PADDING_RIGHT"
          :y1="PADDING_TOP + PLOT_HEIGHT * (1 - fraction)"
          :y2="PADDING_TOP + PLOT_HEIGHT * (1 - fraction)"
          stroke="#e7e5e4"
          stroke-width="1"
        />
        <text
          :x="PADDING_LEFT - 8"
          :y="PADDING_TOP + PLOT_HEIGHT * (1 - fraction) + 3"
          text-anchor="end"
          class="fill-slate-400"
          font-size="9"
        >
          {{ formatCompact(maxRevenue * fraction) }}
        </text>
      </g>

      <path
        v-if="areaPath"
        :d="areaPath"
        fill="currentColor"
        fill-opacity="0.12"
        stroke="none"
      />

      <path
        :d="linePath"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <line
        v-if="hovered"
        :x1="hovered.x"
        :x2="hovered.x"
        :y1="PADDING_TOP"
        :y2="baselineY"
        stroke="#a8a29e"
        stroke-width="1"
      />

      <circle
        v-if="last"
        :cx="last.x"
        :cy="last.y"
        r="4"
        fill="currentColor"
        stroke="white"
        stroke-width="2"
      />
      <circle
        v-if="hovered && hoverIndex !== points.length - 1"
        :cx="hovered.x"
        :cy="hovered.y"
        r="4"
        fill="currentColor"
        stroke="white"
        stroke-width="2"
      />

      <text
        v-if="last"
        :x="last.x"
        :y="Math.max(last.y - 10, PADDING_TOP + 8)"
        text-anchor="end"
        class="fill-slate-700"
        font-size="11"
        font-weight="600"
      >
        {{ formatMoney(last.revenue) }}
      </text>

      <text
        v-for="index in xLabelIndexes"
        :key="index"
        :x="points[index]?.x"
        :y="HEIGHT - 8"
        :text-anchor="labelAnchor(index)"
        class="fill-slate-400"
        font-size="9"
      >
        {{ points[index] ? formatDateShort(points[index]!.date) : '' }}
      </text>
    </svg>

    <div
      v-if="hovered"
      class="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl border border-brand-border/60 bg-white px-3 py-2 text-xs shadow-lg"
      :style="{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }"
    >
      <p class="font-semibold text-slate-900">
        {{ formatMoney(hovered.revenue) }}
      </p>
      <p class="text-brand-muted">
        {{ formatDateShort(hovered.date) }} · {{ hovered.orders }} ta buyurtma
      </p>
    </div>
  </div>
</template>
